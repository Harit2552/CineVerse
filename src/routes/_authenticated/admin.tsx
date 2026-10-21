import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, IndianRupee, Pencil, Plus, ShieldCheck, Ticket, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  claimFirstAdmin,
  deleteMovie,
  deleteShow,
  getAdminOverview,
  getAdminStatus,
  saveMovie,
  saveShow,
  type MovieInput,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatINR, formatShortDate, formatTime } from "@/lib/cinema";

const statusQuery = queryOptions({
  queryKey: ["admin-status"],
  queryFn: () => getAdminStatus(),
});

const overviewQuery = queryOptions({
  queryKey: ["admin-overview"],
  queryFn: () => getAdminOverview(),
  retry: false,
});

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | CineVerse Cinemas" },
      { name: "description", content: "Manage movies, showtimes and bookings for CineVerse." },
      { property: "og:title", content: "Admin Dashboard | CineVerse Cinemas" },
      { property: "og:description", content: "Theater management for CineVerse Cinemas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => (
    <p className="py-24 text-center text-muted-foreground">We couldn&apos;t load the dashboard.</p>
  ),
  component: AdminPage,
});

function AdminPage() {
  const { data: status } = useSuspenseQuery(statusQuery);
  const queryClient = useQueryClient();

  const claim = useMutation({
    mutationFn: () => claimFirstAdmin(),
    onSuccess: async () => {
      toast.success("You are now the theater admin");
      await queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!status.isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <ShieldCheck className="mx-auto size-12 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-4xl tracking-wide">Admin access required</h1>
        {status.adminExists ? (
          <p className="mt-3 text-sm text-muted-foreground">
            This account isn&apos;t a CineVerse administrator. Ask the theater owner to grant you
            access.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              No administrator exists yet for this theater. Claim the role to manage movies,
              showtimes and bookings.
            </p>
            <Button className="mt-6" disabled={claim.isPending} onClick={() => claim.mutate()}>
              {claim.isPending ? "Setting up…" : "Make me the admin"}
            </Button>
          </>
        )}
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data } = useSuspenseQuery(overviewQuery);
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });

  const [movieDraft, setMovieDraft] = useState<MovieInput | null>(null);
  const [showDraft, setShowDraft] = useState<ShowDraft | null>(null);

  const removeMovie = useMutation({
    mutationFn: (id: string) => deleteMovie({ data: { id } }),
    onSuccess: async () => {
      toast.success("Movie removed");
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeShow = useMutation({
    mutationFn: (id: string) => deleteShow({ data: { id } }),
    onSuccess: async () => {
      toast.success("Showtime removed");
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="fade-up">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">CineVerse</p>
        <h1 className="mt-2 font-display text-4xl tracking-wide sm:text-5xl">Admin Dashboard</h1>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Ticket className="size-4" />} label="Total bookings" value={String(data.stats.totalBookings)} />
        <Stat icon={<IndianRupee className="size-4" />} label="Revenue today" value={formatINR(data.stats.todayRevenue)} />
        <Stat icon={<Users className="size-4" />} label="Tickets sold" value={String(data.stats.ticketsSold)} />
        <Stat icon={<BarChart3 className="size-4" />} label="Occupancy today" value={`${data.stats.occupancy}%`} />
      </div>

      <Tabs defaultValue="bookings" className="mt-10">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="shows">Showtimes</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Movie</th>
                  <th className="p-3">Show</th>
                  <th className="p-3">Seats</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No bookings yet.
                    </td>
                  </tr>
                ) : (
                  data.bookings.map((b: any) => (
                    <tr key={b.id} className="border-t border-border/70">
                      <td className="p-3 font-medium">{b.booking_code}</td>
                      <td className="p-3">{b.show?.movie?.title ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">
                        {b.show ? `${formatShortDate(b.show.show_date)} · ${formatTime(b.show.show_time)}` : "—"}
                      </td>
                      <td className="p-3 text-muted-foreground">{(b.seats ?? []).join(", ")}</td>
                      <td className="p-3">{formatINR(b.total_amount)}</td>
                      <td className="p-3">
                        <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="movies" className="mt-6">
          <div className="flex justify-end">
            <Button onClick={() => setMovieDraft(emptyMovie())}>
              <Plus className="size-4" /> Add movie
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {data.movies.map((m: any) => (
              <div
                key={m.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <img src={m.poster_url} alt="" className="h-20 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl tracking-wide">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.genre} · {m.language} · {m.duration_min} min · {m.status}
                  </p>
                </div>
                <Button size="icon" variant="outline" aria-label={`Edit ${m.title}`} onClick={() => setMovieDraft(toMovieInput(m))}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Delete ${m.title}`}
                  onClick={() => removeMovie.mutate(m.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shows" className="mt-6">
          <div className="flex justify-end">
            <Button
              onClick={() =>
                setShowDraft({
                  movie_id: data.movies[0]?.id ?? "",
                  screen_id: data.screens[0]?.id ?? "",
                  show_date: new Date().toISOString().slice(0, 10),
                  show_time: "19:30",
                  base_price: 250,
                })
              }
            >
              <Plus className="size-4" /> Add showtime
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.shows.map((s: any) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.movie?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatShortDate(s.show_date)} · {formatTime(s.show_time)} · {s.screen?.name} ·{" "}
                    {formatINR(s.base_price)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="Edit showtime"
                  onClick={() =>
                    setShowDraft({
                      id: s.id,
                      movie_id: s.movie?.id ?? "",
                      screen_id: s.screen?.id ?? "",
                      show_date: s.show_date,
                      show_time: s.show_time.slice(0, 5),
                      base_price: s.base_price,
                    })
                  }
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete showtime"
                  onClick={() => removeShow.mutate(s.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <MovieDialog
        key={`movie-${movieDraft?.id ?? (movieDraft ? "new" : "none")}`}
        draft={movieDraft}
        onClose={() => setMovieDraft(null)}
        onSaved={refresh}
      />
      <ShowDialog
        key={`show-${showDraft?.id ?? (showDraft ? "new" : "none")}`}
        draft={showDraft}
        movies={data.movies}
        screens={data.screens}
        onClose={() => setShowDraft(null)}
        onSaved={refresh}
      />

    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 font-display text-3xl tracking-wide">{value}</p>
    </div>
  );
}

function emptyMovie(): MovieInput {
  return {
    title: "",
    poster_url: "/images/posters/dune.jpg",
    genre: "Drama",
    duration_min: 120,
    language: "English",
    rating: 8,
    age_rating: "UA",
    description: "",
    cast_list: [],
    trailer_url: "",
    status: "now_showing",
  };
}

function toMovieInput(m: any): MovieInput {
  return {
    id: m.id,
    title: m.title,
    poster_url: m.poster_url,
    genre: m.genre,
    duration_min: m.duration_min,
    language: m.language,
    rating: m.rating,
    age_rating: m.age_rating,
    description: m.description ?? "",
    cast_list: m.cast_list ?? [],
    trailer_url: m.trailer_url ?? "",
    status: m.status,
  };
}

function MovieDialog({
  draft,
  onClose,
  onSaved,
}: {
  draft: MovieInput | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<MovieInput | null>(draft);


  const save = useMutation({
    mutationFn: (input: MovieInput) => saveMovie({ data: input }),
    onSuccess: () => {
      toast.success("Movie saved");
      onClose();
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const value = form ?? draft;

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit movie" : "Add movie"}</DialogTitle>
        </DialogHeader>
        {value ? (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(value);
            }}
          >
            <Field label="Title">
              <Input
                value={value.title}
                onChange={(e) => setForm({ ...value, title: e.target.value })}
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Genre">
                <Input value={value.genre} onChange={(e) => setForm({ ...value, genre: e.target.value })} />
              </Field>
              <Field label="Language">
                <Input
                  value={value.language}
                  onChange={(e) => setForm({ ...value, language: e.target.value })}
                />
              </Field>
              <Field label="Duration (min)">
                <Input
                  type="number"
                  value={value.duration_min}
                  onChange={(e) => setForm({ ...value, duration_min: Number(e.target.value) })}
                />
              </Field>
              <Field label="Rating (0-10)">
                <Input
                  type="number"
                  step="0.1"
                  value={value.rating}
                  onChange={(e) => setForm({ ...value, rating: Number(e.target.value) })}
                />
              </Field>
              <Field label="Age rating">
                <Input
                  value={value.age_rating}
                  onChange={(e) => setForm({ ...value, age_rating: e.target.value })}
                />
              </Field>
              <Field label="Status">
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={value.status}
                  onChange={(e) => setForm({ ...value, status: e.target.value })}
                >
                  <option value="now_showing">Now showing</option>
                  <option value="coming_soon">Coming soon</option>
                </select>
              </Field>
            </div>
            <Field label="Poster URL">
              <Input
                value={value.poster_url}
                onChange={(e) => setForm({ ...value, poster_url: e.target.value })}
              />
            </Field>
            <Field label="Cast (comma separated)">
              <Input
                value={value.cast_list.join(", ")}
                onChange={(e) =>
                  setForm({
                    ...value,
                    cast_list: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={4}
                value={value.description}
                onChange={(e) => setForm({ ...value, description: e.target.value })}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save movie"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type ShowDraft = {
  id?: string;
  movie_id: string;
  screen_id: string;
  show_date: string;
  show_time: string;
  base_price: number;
};

function ShowDialog({
  draft,
  movies,
  screens,
  onClose,
  onSaved,
}: {
  draft: ShowDraft | null;
  movies: any[];
  screens: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ShowDraft | null>(draft);
  const value = form ?? draft;

  const save = useMutation({
    mutationFn: (input: ShowDraft) =>
      saveShow({ data: { ...input, show_time: `${input.show_time}:00`.slice(0, 8) } }),
    onSuccess: () => {
      toast.success("Showtime saved");
      onClose();
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={draft !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{draft?.id ? "Edit showtime" : "Add showtime"}</DialogTitle>
        </DialogHeader>
        {value ? (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(value);
            }}
          >
            <Field label="Movie">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={value.movie_id}
                onChange={(e) => setForm({ ...value, movie_id: e.target.value })}
              >
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Screen">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={value.screen_id}
                onChange={(e) => setForm({ ...value, screen_id: e.target.value })}
              >
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <Input
                  type="date"
                  value={value.show_date}
                  onChange={(e) => setForm({ ...value, show_date: e.target.value })}
                />
              </Field>
              <Field label="Time">
                <Input
                  type="time"
                  value={value.show_time}
                  onChange={(e) => setForm({ ...value, show_time: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Base price (₹)">
              <Input
                type="number"
                value={value.base_price}
                onChange={(e) => setForm({ ...value, base_price: Number(e.target.value) })}
              />
            </Field>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save showtime"}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
