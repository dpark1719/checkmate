"use client";

import {
  GoalProgressComparison,
  type GoalComparisonPost,
  type GoalStatsDisplay,
} from "@/components/GoalProgressComparison";
import {
  PostThumbnailGrid,
  type ThumbnailPost,
} from "@/components/PostThumbnailGrid";
import { SimilarGoalsSection } from "@/components/SimilarGoalsSection";
import {
  daysUntilTarget,
  formatTargetEndDate,
  isTargetDateReached,
} from "@/lib/goal-dates";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface GoalInfo {
  id: string;
  title: string;
  category: string;
  targetEndDate: string | null;
  completedAt: string | null;
  completionNote: string | null;
  isActive: boolean;
  archivedAt: string | null;
}

interface GoalProgress {
  targetEndDate: string | null;
  daysRemaining: number | null;
  daysElapsed: number;
  percentTimeElapsed: number | null;
  stats: GoalStatsDisplay;
}

export default function GoalPostsPage() {
  const params = useParams();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<GoalInfo | null>(null);
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [posts, setPosts] = useState<ThumbnailPost[]>([]);
  const [startPost, setStartPost] = useState<GoalComparisonPost | null>(null);
  const [endPost, setEndPost] = useState<GoalComparisonPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [selectedStartId, setSelectedStartId] = useState<string | null>(null);
  const [selectedEndId, setSelectedEndId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/goals/${goalId}/posts`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data.error) {
          setError(
            data.error ??
              (r.status === 404 ? "Goal not found" : "Could not load goal")
          );
          setGoal(null);
          setProgress(null);
          setPosts([]);
          return;
        }
        setGoal(data.goal ?? null);
        setProgress(data.progress ?? null);
        setPosts(data.posts ?? []);
        setStartPost(data.startPost ?? null);
        setEndPost(data.endPost ?? null);

        const postList = (data.posts ?? []) as ThumbnailPost[];
        if (postList.length > 0) {
          const sorted = [...postList].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setSelectedStartId(sorted[0]?.id ?? null);
          setSelectedEndId(sorted[sorted.length - 1]?.id ?? null);
        }
      })
      .catch(() => setError("Could not load goal"))
      .finally(() => setLoading(false));
  }, [goalId]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = progress?.stats;
  const checkInCount = stats?.checkInCount ?? posts.length;

  const isCompleted = Boolean(goal?.completedAt);
  const canComplete = Boolean(
    goal?.isActive && !goal?.archivedAt && goal?.targetEndDate
  );
  const targetReached = isTargetDateReached(goal?.targetEndDate ?? null);

  const sortedPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [posts]
  );

  async function submitComplete() {
    setCompleting(true);
    setCompleteError(null);
    const res = await fetch(`/api/goals/${goalId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completionNote: completionNote.trim() || undefined,
        startPostId: selectedStartId ?? undefined,
        endPostId: selectedEndId ?? undefined,
      }),
    });
    const data = await res.json();
    setCompleting(false);
    if (!res.ok) {
      setCompleteError(data.error ?? "Could not complete goal");
      return;
    }
    setShowCompleteModal(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/goals" className="gp-btn-text">
          ← Back to goals
        </Link>
      </div>

      {loading ? (
        <p className="gp-text-muted">Loading…</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : goal ? (
        <>
          <header className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">{goal.title}</h1>
                <p className="text-sm gp-text-muted capitalize">
                  {goal.category}
                  {isCompleted
                    ? " · Completed"
                    : progress
                      ? ` · ${checkInCount} check-in${checkInCount === 1 ? "" : "s"}`
                      : ""}
                </p>
              </div>
              {canComplete && !isCompleted ? (
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                    targetReached
                      ? "bg-accent text-accent-foreground"
                      : "border border-[var(--gp-border)] hover:bg-[var(--gp-card)]"
                  }`}
                >
                  Complete goal
                </button>
              ) : null}
            </div>

            {!isCompleted && progress && stats ? (
              <div className="rounded-xl border border-[var(--gp-border)] p-4 space-y-3">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <p className="gp-text-muted text-xs">Days left</p>
                    <p className="font-medium">
                      {progress.daysRemaining !== null
                        ? Math.max(0, progress.daysRemaining)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="gp-text-muted text-xs">Check-ins</p>
                    <p className="font-medium">{stats.checkInCount}</p>
                  </div>
                  <div>
                    <p className="gp-text-muted text-xs">Current streak</p>
                    <p className="font-medium">{stats.currentStreak}🔥</p>
                  </div>
                  <div>
                    <p className="gp-text-muted text-xs">Target</p>
                    <p className="font-medium">
                      {goal.targetEndDate
                        ? formatTargetEndDate(goal.targetEndDate)
                        : "Not set"}
                    </p>
                  </div>
                </div>
                {progress.percentTimeElapsed !== null ? (
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-[var(--gp-surface)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent/80"
                        style={{ width: `${progress.percentTimeElapsed}%` }}
                      />
                    </div>
                    <p className="text-xs gp-text-muted">
                      {progress.percentTimeElapsed}% of time elapsed
                    </p>
                  </div>
                ) : null}
                {!goal.targetEndDate ? (
                  <p className="text-xs text-amber-500">
                    Set a target end date on the goals page before you can
                    complete this goal.
                  </p>
                ) : null}
              </div>
            ) : null}

            {isCompleted && progress && stats ? (
              <GoalProgressComparison
                title={goal.title}
                category={goal.category}
                stats={stats}
                startPost={startPost}
                endPost={endPost}
                completionNote={goal.completionNote}
              />
            ) : null}
          </header>

          {!isCompleted ? (
            <>
              {posts.length === 0 ? (
                <p className="gp-text-muted text-sm">
                  No check-ins for this goal yet. Post from the Post tab.
                </p>
              ) : (
                <PostThumbnailGrid posts={posts} onPostUpdated={() => load()} />
              )}

              <section className="border-t border-[var(--gp-border)] pt-6">
                <SimilarGoalsSection title={goal.title} category={goal.category} />
              </section>
            </>
          ) : (
            <>
              {posts.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">All check-ins</h2>
                  <PostThumbnailGrid posts={posts} onPostUpdated={() => load()} />
                </section>
              ) : null}
              <section className="border-t border-[var(--gp-border)] pt-6">
                <SimilarGoalsSection title={goal.title} category={goal.category} />
              </section>
            </>
          )}
        </>
      ) : null}

      {showCompleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--gp-border)] bg-[var(--gp-bg)] p-5 space-y-4">
            <h2 className="text-lg font-semibold">Complete goal</h2>
            <p className="text-sm gp-text-muted">
              Choose your start and end photos, add an optional note, and mark
              this goal finished. You&apos;ll free up a slot for a new goal.
            </p>

            {sortedPosts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs gp-text-muted uppercase tracking-wide">
                  Pick photos
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {sortedPosts.map((post) => {
                    const isStart = selectedStartId === post.id;
                    const isEnd = selectedEndId === post.id;
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => {
                          if (!isStart && !isEnd) {
                            if (!selectedStartId) setSelectedStartId(post.id);
                            else if (!selectedEndId) setSelectedEndId(post.id);
                            else setSelectedEndId(post.id);
                          } else if (isStart) {
                            setSelectedStartId(null);
                          } else {
                            setSelectedEndId(null);
                          }
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                          isStart
                            ? "border-green-500"
                            : isEnd
                              ? "border-accent"
                              : "border-transparent"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.photoUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {(isStart || isEnd) && (
                          <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-black/70 text-white px-1.5 py-0.5 rounded">
                            {isStart ? "Start" : "End"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs gp-text-muted">
                  Tap photos to set start (green) and end (accent). Defaults are
                  first and last check-ins.
                </p>
              </div>
            ) : (
              <p className="text-sm gp-text-muted">
                No check-in photos yet — you can still complete, but your
                comparison will have empty slots.
              </p>
            )}

            {progress && stats ? (
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="gp-text-muted text-xs">Days active</dt>
                  <dd>{stats.daysActive}</dd>
                </div>
                <div>
                  <dt className="gp-text-muted text-xs">Check-ins</dt>
                  <dd>{stats.checkInCount}</dd>
                </div>
                <div>
                  <dt className="gp-text-muted text-xs">Best streak</dt>
                  <dd>{stats.longestStreak}🔥</dd>
                </div>
                <div>
                  <dt className="gp-text-muted text-xs">Days left</dt>
                  <dd>
                    {goal?.targetEndDate
                      ? Math.max(0, daysUntilTarget(goal.targetEndDate) ?? 0)
                      : "—"}
                  </dd>
                </div>
              </dl>
            ) : null}

            <label className="block text-sm gp-text-muted">
              Reflection (optional)
            </label>
            <textarea
              value={completionNote}
              onChange={(e) => setCompletionNote(e.target.value)}
              rows={3}
              className="w-full gp-input resize-none"
              placeholder="What did you learn? What changed?"
            />

            {completeError ? (
              <p className="text-sm text-red-400">{completeError}</p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submitComplete()}
                disabled={completing}
                className="flex-1 rounded-lg bg-accent text-accent-foreground font-semibold py-2 text-sm disabled:opacity-50"
              >
                {completing ? "Completing…" : "Mark complete"}
              </button>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                disabled={completing}
                className="flex-1 rounded-lg border border-[var(--gp-border)] py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
