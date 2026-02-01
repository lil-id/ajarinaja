import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    try {
        const {
            materialId,
            numQuestions = 10,
            difficulty = "medium",
            topic = "",
            questionTypes = ["multiple_choice"],
        } = await req.json();

        if (!materialId) {
            throw new Error("materialId is required");
        }

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
            throw new Error("Unauthorized");
        }

        // Get material info
        const { data: material, error: materialError } = await supabaseClient
            .from("ai_materials")
            .select("*")
            .eq("id", materialId)
            .eq("teacher_id", user.id)
            .single();

        if (materialError || !material) {
            throw new Error("Material not found or access denied");
        }

        if (material.status !== "ready") {
            throw new Error(`Material is ${material.status}. Please wait for processing to complete.`);
        }

        // Generate query embedding for topic
        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const queryText = topic || "general educational content";
        const queryEmbedding = await generateEmbedding(queryText, GEMINI_API_KEY);

        // Perform vector similarity search
        const { data: relevantChunks, error: searchError } = await supabaseClient
            .rpc("match_material_chunks", {
                query_embedding: queryEmbedding,
                match_threshold: 0.5,
                match_count: 5,
                filter_material_id: materialId,
            });

        if (searchError) {
            throw new Error(`Search error: ${searchError.message}`);
        }

        // Construct context from chunks
        const context = relevantChunks
            ?.map((chunk: any) => chunk.chunk_text)
            .join("\n\n") || "";

        if (!context) {
            throw new Error("No relevant content found for the given topic");
        }

        // Generate questions using Gemini
        const questions = await generateQuestions({
            context,
            numQuestions,
            difficulty,
            topic: topic || "general",
            questionTypes,
            apiKey: GEMINI_API_KEY,
        });

        // Save to database
        const { data: savedGeneration, error: saveError } = await supabaseClient
            .from("ai_generated_questions")
            .insert({
                material_id: materialId,
                teacher_id: user.id,
                questions: questions,
                parameters: {
                    numQuestions,
                    difficulty,
                    topic,
                    questionTypes,
                },
                status: "draft",
            })
            .select()
            .single();

        if (saveError) {
            throw new Error(`Failed to save questions: ${saveError.message}`);
        }

        return new Response(
            JSON.stringify({
                success: true,
                generationId: savedGeneration.id,
                questions: questions,
                metadata: {
                    materialTitle: material.title,
                    chunksUsed: relevantChunks?.length || 0,
                    parameters: {
                        numQuestions,
                        difficulty,
                        topic,
                    },
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        console.error("Error generating questions:", error);

        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});

/**
 * Generate embedding using Gemini Embedding API
 */
async function generateEmbedding(
    text: string,
    apiKey: string
): Promise<number[]> {
    const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

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
        throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.embedding.values;
}

/**
 * Generate questions using Gemini with structured output
 */
async function generateQuestions(params: {
    context: string;
    numQuestions: number;
    difficulty: string;
    topic: string;
    questionTypes: string[];
    apiKey: string;
}): Promise<any[]> {
    const {
        context,
        numQuestions,
        difficulty,
        topic,
        questionTypes,
        apiKey,
    } = params;

    const prompt = `Kamu adalah asisten pendidikan yang ahli dalam membuat soal ujian berkualitas tinggi dalam Bahasa Indonesia.

Berdasarkan materi berikut, buatlah ${numQuestions} soal pilihan ganda.

**Parameter:**
- Tingkat Kesulitan: ${difficulty}
- Topik Fokus: ${topic}
- Jenis Soal: ${questionTypes.join(", ")}

**Materi Pembelajaran:**
${context}

**Instruksi:**
1. Buat soal yang relevan dengan materi yang diberikan
2. Setiap soal harus memiliki 4 pilihan jawaban (A, B, C, D)
3. Semua pilihan harus masuk akal dan tidak terlalu mudah dibedakan
4. Sertakan penjelasan untuk jawaban yang benar
5. Gunakan Bahasa Indonesia yang baik dan benar
6. Pastikan soal sesuai dengan tingkat kesulitan yang diminta

**Format Output (JSON):**
{
  "questions": [
    {
      "question_text": "Teks soal dalam bahasa Indonesia",
      "question_type": "multiple_choice",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correct_answer": 0,
      "explanation": "Penjelasan mengapa jawaban ini benar",
      "difficulty": "${difficulty}",
      "bloom_level": "remembering|understanding|applying|analyzing|evaluating|creating"
    }
  ]
}

PENTING: Response harus dalam format JSON yang valid. Jangan tambahkan teks lain di luar JSON.`;

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

    const response = await fetch(`${url}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }],
                },
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: "application/json",
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    try {
        const parsed = JSON.parse(text);
        return parsed.questions || [];
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Failed to parse AI response");
    }
}
