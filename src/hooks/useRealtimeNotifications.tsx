import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export const useRealtimeNotifications = (userId: string | null) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Create a single channel for all realtime subscriptions
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
        },
        (payload: RealtimePayload) => {
          handleJobApplicationChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assessments',
        },
        (payload: RealtimePayload) => {
          handleAssessmentChange(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [userId]);

  const handleJobApplicationChange = (payload: RealtimePayload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      toast({
        title: '📝 New Job Application',
        description: `A new job application has been submitted`,
      });
    } else if (eventType === 'UPDATE') {
      const newStatus = newRecord?.status as string;
      const oldStatus = oldRecord?.status as string;
      
      if (newStatus !== oldStatus) {
        const statusMessages: Record<string, { title: string; description: string }> = {
          shortlisted: {
            title: '🎉 Application Shortlisted!',
            description: 'Congratulations! Your application has been shortlisted.',
          },
          hired: {
            title: '🎊 You Got Hired!',
            description: 'Amazing news! You have been selected for the position.',
          },
          rejected: {
            title: '📋 Application Update',
            description: 'Your application status has been updated.',
          },
          interview: {
            title: '📅 Interview Scheduled',
            description: 'You have been invited for an interview!',
          },
        };

        const message = statusMessages[newStatus] || {
          title: '📋 Application Status Updated',
          description: `Your application status changed to: ${newStatus}`,
        };

        toast({
          title: message.title,
          description: message.description,
          variant: newStatus === 'rejected' ? 'destructive' : 'default',
        });
      }
    }
  };

  const handleAssessmentChange = (payload: RealtimePayload) => {
    const { eventType, new: newRecord } = payload;

    if (eventType === 'INSERT') {
      const score = newRecord?.score as number;
      const testCategory = newRecord?.test_category as string;
      const totalQuestions = newRecord?.total_questions as number;
      const correctAnswers = newRecord?.correct_answers as number;

      if (score !== undefined) {
        const isGoodScore = score >= 70;
        toast({
          title: isGoodScore ? '🏆 Assessment Completed!' : '📊 Assessment Results',
          description: `${testCategory}: ${correctAnswers}/${totalQuestions} correct (${score}%)`,
          variant: isGoodScore ? 'default' : 'destructive',
        });
      } else {
        toast({
          title: '📝 New Assessment Created',
          description: `A new ${testCategory} assessment is available`,
        });
      }
    }
  };
};
