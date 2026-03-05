declare const Deno: { env: { get(key: string): string | undefined } };

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "../_shared/logger.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const correlationId = logger.generateCorrelationId();
    const startTime = Date.now();

    try {
        // Get request data
        const { materialId, chunkSize = 500, chunkOverlap = 50 } = await req.json();

        logger.info("process-material started", {
            correlationId,
            materialId,
            chunkSize,
            chunkOverlap,
        });

        if (!materialId) {
            logger.warn("process-material rejected: materialId missing", { correlationId });
            throw new Error("materialId is required");
        }

        // Get JWT from Authorization header
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            logger.warn("process-material rejected: Missing authorization header", { correlationId, materialId });
            return new Response(
                JSON.stringify({ error: "Missing authorization header" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 401,
                }
            );
        }

        // Extract and decode JWT payload (no crypto verification - Supabase handles this)
        const token = authHeader.replace("Bearer ", "");

        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            logger.warn("process-material rejected: Invalid JWT format", { correlationId, materialId });
            return new Response(
                JSON.stringify({ error: "Invalid JWT format" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 401,
                }
            );
        }

        // Decode base64url payload
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        const userId = payload.sub || payload.user_id || payload.id;

        if (!userId) {
            logger.error("FAILED: No user ID field found in JWT", { correlationId, materialId, payloadKeys: Object.keys(payload) });
            return new Response(
                JSON.stringify({
                    error: "No user ID in JWT",
                    debug: {
                        payloadKeys: Object.keys(payload),
                        checked: ['sub', 'user_id', 'id']
                    }
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 401,
                }
            );
        }

        // Use service role for database operations
        const serviceClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Get material
        const { data: material, error: materialError } = await serviceClient
            .from("ai_materials")
            .select("*")
            .eq("id", materialId)
            .single();

        if (materialError || !material) {
            logger.warn("process-material failed: Material not found", { correlationId, materialId });
            throw new Error("Material not found");
        }

        // Verify ownership
        if (material.teacher_id !== userId) {
            logger.warn("process-material rejected: Unauthorized", { correlationId, materialId, userId });
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 403,
                }
            );
        }

        // Update to processing
        await serviceClient
            .from("ai_materials")
            .update({ status: "processing" })
            .eq("id", materialId);

        // Download file
        const { data: fileData, error: downloadError } = await serviceClient
            .storage
            .from("materials")
            .download(material.file_url);

        if (downloadError) {
            throw new Error(`Download failed: ${downloadError.message}`);
        }

        // Extract text
        let extractedText = "";

        if (material.file_type === "txt") {
            extractedText = await fileData.text();
        } else if (material.file_type === "pdf") {
            const arrayBuffer = await fileData.arrayBuffer();
            const pdfData = await parsePDF(arrayBuffer);
            extractedText = pdfData.text;
        } else {
            throw new Error(`Unsupported: ${material.file_type}`);
        }

        // Chunk text
        const chunks = smartChunk(extractedText, chunkSize, chunkOverlap);
        logger.debug("process-material chunking complete", { correlationId, materialId, chunkCount: chunks.length });

        // Generate embeddings
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not set");
        }

        const processedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            const embedding = await generateEmbedding(chunk.text, GEMINI_API_KEY);

            const { error: insertError } = await serviceClient
                .from("material_chunks")
                .insert({
                    material_id: materialId,
                    chunk_text: chunk.text,
                    chunk_index: i,
                    embedding: embedding,
                    metadata: chunk.metadata,
                });

            if (insertError) {
                logger.error(`process-material chunk insert error`, { correlationId, materialId, chunkIndex: i, error: insertError });
                throw insertError;
            }

            processedChunks.push({ index: i, length: chunk.text.length });
        }

        // Update to ready
        await serviceClient
            .from("ai_materials")
            .update({
                status: "ready",
                total_chunks: chunks.length,
            })
            .eq("id", materialId);

        logger.info("process-material completed successfully", {
            correlationId,
            materialId,
            totalChunks: chunks.length,
            duration: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify({
                success: true,
                materialId,
                totalChunks: chunks.length,
                chunks: processedChunks,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const err = error as Error;
        logger.error("process-material failed", {
            correlationId,
            error: err,
            duration: Date.now() - startTime,
        });

        const { materialId } = await req.json().catch(() => ({}));
        if (materialId) {
            const serviceClient = createClient(
                Deno.env.get("SUPABASE_URL") ?? "",
                Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
            );

            await serviceClient
                .from("ai_materials")
                .update({
                    status: "error",
                    error_message: err.message,
                })
                .eq("id", materialId);
        }

        return new Response(
            JSON.stringify({ error: err.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});

function smartChunk(
    text: string,
    chunkSize: number,
    overlap: number
): Array<{ text: string; metadata: Record<string, unknown> }> {
    const chunks = [];
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    let currentChunk = "";
    let paragraphIndex = 0;

    for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();

        if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
            chunks.push({
                text: currentChunk.trim(),
                metadata: { paragraphIndex },
            });

            currentChunk = currentChunk.slice(-overlap) + " " + trimmed;
        } else {
            currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + trimmed;
        }

        paragraphIndex++;
    }

    if (currentChunk.trim().length > 0) {
        chunks.push({
            text: currentChunk.trim(),
            metadata: { paragraphIndex },
        });
    }

    return chunks;
}

async function parsePDF(arrayBuffer: ArrayBuffer): Promise<{ text: string; numpages: number }> {
    try {
        // Import unpdf - lightweight PDF parser for server-side (no browser dependencies)
        const { extractText, getDocumentProxy } = await import("https://esm.sh/unpdf@0.11.0");

        // Convert ArrayBuffer to Uint8Array for unpdf
        const uint8Array = new Uint8Array(arrayBuffer);

        // Extract text from PDF
        const { text, totalPages } = await extractText(uint8Array, {
            mergePages: true  // Combine all pages into single text
        });

        return {
            text: text || '',
            numpages: totalPages || 0
        };
    } catch (error) {
        const err = error as Error;
        logger.error("PDF parsing error", { error: err });
        throw new Error(`PDF parse failed: ${err.message}`);
    }
}

async function generateEmbedding(
    text: string,
    apiKey: string
): Promise<number[]> {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    const response = await fetch(`${url}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "models/gemini-embedding-001",
            content: {
                parts: [{ text }],
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini error: ${error}`);
    }

    const data = await response.json();
    return data.embedding.values;
}
