import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SubjectRecord, TopicRecord } from "@/lib/questions";

export function useSubjects(enabled = true) {
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code, division, is_active, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SubjectRecord[];
    },
  });

  const topicsQuery = useQuery({
    queryKey: ["topics"],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("id, subject_id, parent_topic_id, name, is_active")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TopicRecord[];
    },
  });

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const topics = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );
  const topicById = useMemo(() => new Map(topics.map((topic) => [topic.id, topic])), [topics]);

  return {
    subjects,
    topics,
    subjectById,
    topicById,
    subjectName: (id: string | null) => (id ? (subjectById.get(id)?.name ?? "—") : "—"),
    topicName: (id: string | null) => (id ? (topicById.get(id)?.name ?? "—") : "—"),
    topicsFor: (subjectId: string | null) =>
      topics.filter((topic) => topic.subject_id === subjectId && !topic.parent_topic_id),
    subtopicsFor: (topicId: string | null) =>
      topics.filter((topic) => topic.parent_topic_id === topicId),
    isLoading: subjectsQuery.isLoading || topicsQuery.isLoading,
    isError: subjectsQuery.isError || topicsQuery.isError,
  };
}
