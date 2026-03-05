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
        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get auth user
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
            token
        );

        if (userError || !user) {
            logger.warn("list-materials rejected: Unauthorized", { correlationId, error: userError });
            throw new Error("Unauthorized");
        }

        // Get query parameters
        const url = new URL(req.url);
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "";

        logger.info("list-materials started", {
            correlationId,
            userId: user.id,
            search,
            status,
        });

        // Build query
        let query = supabaseClient
            .from("ai_materials")
            .select("*, material_chunks(count)")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: false });

        // Apply filters
        if (status && status !== "all") {
            query = query.eq("status", status);
        }

        if (search) {
            query = query.or(
                `title.ilike.%${search}%,metadata->>description.ilike.%${search}%`
            );
        }

        const { data: materials, error: queryError } = await query;

        if (queryError) {
            throw queryError;
        }

        // Get teacher stats
        const { data: stats } = await supabaseClient
            .rpc("get_teacher_ai_stats", {
                teacher_uuid: user.id,
            })
            .single();

        logger.info("list-materials completed successfully", {
            correlationId,
            userId: user.id,
            materialsCount: materials?.length || 0,
            duration: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify({
                success: true,
                materials: materials || [],
                stats: stats || {
                    total_materials: 0,
                    total_chunks: 0,
                    total_questions_generated: 0,
                    ready_materials: 0,
                    processing_materials: 0,
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        const err = error as Error;
        logger.error("list-materials failed", {
            correlationId,
            error: err,
            duration: Date.now() - startTime,
        });

        return new Response(
            JSON.stringify({ error: err.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
