import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GeneratedQuestion {
    question_text: string;
    question_type: 'multiple_choice' | 'essay' | 'true_false';
    options?: string[];
    correct_answer?: number;
    explanation?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    bloom_level?: string;
}

export interface AIGeneratedQuestions {
    id: string;
    material_id: string;
    teacher_id: string;
    questions: GeneratedQuestion[];
    parameters: {
        numQuestions: number;
        difficulty: string;
        topic?: string;
    };
    status: 'draft' | 'saved';
    created_at: string;
}

/**
 * Hook for AI question generation
 */
export function useQuestionGeneration() {
    const queryClient = useQueryClient();

    // Get generation history
    const { data: generationHistory = [] } = useQuery({
        queryKey: ['ai-generated-questions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_generated_questions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as AIGeneratedQuestions[];
        },
    });

    // Generate questions using AI
    const generateQuestions = useMutation({
        mutationFn: async ({
            materialId,
            numQuestions,
            difficulty,
            topic,
            questionTypes = ['multiple_choice'],
        }: {
            materialId: string;
            numQuestions: number;
            difficulty: 'easy' | 'medium' | 'hard';
            topic?: string;
            questionTypes?: string[];
        }) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Not authenticated');

            toast.info('Generating questions... This may take 30-60 seconds.');

            const functionsUrl = import.meta.env.VITE_SUPABASE_URL;

            const response = await fetch(
                `${functionsUrl}/functions/v1/generate-questions`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({
                        materialId,
                        numQuestions,
                        difficulty,
                        topic,
                        questionTypes,
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Generation failed');
            }

            const result = await response.json();
            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['ai-generated-questions'] });
            toast.success(`Generated ${data.questions.length} questions successfully!`);
        },
        onError: (error: Error) => {
            toast.error(`Generation failed: ${error.message}`);
        },
    });

    // Save questions to question bank
    const saveToBank = useMutation({
        mutationFn: async ({
            questions,
            courseId,
        }: {
            questions: GeneratedQuestion[];
            courseId?: string;
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Transform AI questions to question_bank format
            const questionBankData = questions.map((q) => ({
                teacher_id: user.id,
                course_id: courseId || null,
                question: q.question_text,
                type: q.question_type,
                options: q.options || null,
                correct_answer: q.correct_answer,
                correct_answers: null, // for multiple_select type
                points: 10, // default points
                category: 'AI Generated', // default category for AI questions
                tags: ['ai-generated'],
                explanation: q.explanation || null,
            }));

            const { data, error } = await supabase
                .from('question_bank')
                .insert(questionBankData)
                .select();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['question-bank'] });
            toast.success(`Saved ${data.length} questions to question bank`);
        },
        onError: (error: Error) => {
            toast.error(`Save failed: ${error.message}`);
        },
    });

    // Update generation status
    const updateGenerationStatus = useMutation({
        mutationFn: async ({
            generationId,
            status,
        }: {
            generationId: string;
            status: 'draft' | 'saved';
        }) => {
            const { error } = await supabase
                .from('ai_generated_questions')
                .update({ status })
                .eq('id', generationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-generated-questions'] });
        },
    });

    return {
        generationHistory,
        generateQuestions,
        saveToBank,
        updateGenerationStatus,
    };
}
