-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- MOVIES
CREATE TABLE public.movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  poster_url text NOT NULL DEFAULT '',
  genre text NOT NULL DEFAULT '',
  duration_min int NOT NULL DEFAULT 120,
  language text NOT NULL DEFAULT 'English',
  rating numeric(2,1) NOT NULL DEFAULT 8.0,
  age_rating text NOT NULL DEFAULT 'UA',
  description text NOT NULL DEFAULT '',
  cast_list text[] NOT NULL DEFAULT '{}',
  trailer_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'now_showing',
  release_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.movies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movies TO authenticated;
GRANT ALL ON public.movies TO service_role;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "movies public read" ON public.movies FOR SELECT USING (true);
CREATE POLICY "movies admin write" ON public.movies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  format text NOT NULL DEFAULT 'Dolby Atmos',
  total_seats int NOT NULL DEFAULT 88,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.screens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screens TO authenticated;
GRANT ALL ON public.screens TO service_role;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screens public read" ON public.screens FOR SELECT USING (true);
CREATE POLICY "screens admin write" ON public.screens FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
  screen_id uuid NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  show_date date NOT NULL,
  show_time time NOT NULL,
  base_price int NOT NULL DEFAULT 200,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (screen_id, show_date, show_time)
);
GRANT SELECT ON public.shows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shows TO authenticated;
GRANT ALL ON public.shows TO service_role;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shows public read" ON public.shows FOR SELECT USING (true);
CREATE POLICY "shows admin write" ON public.shows FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  show_id uuid NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  seats text[] NOT NULL,
  ticket_total int NOT NULL,
  convenience_fee int NOT NULL,
  taxes int NOT NULL,
  total_amount int NOT NULL,
  payment_method text NOT NULL DEFAULT 'upi',
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings own read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bookings own insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings own update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.booking_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  seat_id text NOT NULL,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (show_id, seat_id)
);
CREATE INDEX booking_seats_show_idx ON public.booking_seats(show_id);
GRANT SELECT ON public.booking_seats TO anon;
GRANT SELECT, INSERT, DELETE ON public.booking_seats TO authenticated;
GRANT ALL ON public.booking_seats TO service_role;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booked seats public read" ON public.booking_seats FOR SELECT USING (true);
CREATE POLICY "booked seats insert own" ON public.booking_seats FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));
CREATE POLICY "booked seats delete own" ON public.booking_seats FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- SEED
INSERT INTO public.screens (name, format, total_seats) VALUES
  ('Screen 1','Dolby Atmos Laser',88),
  ('Screen 2','IMAX with Laser',88),
  ('Screen 3','Recliner Lounge',88),
  ('Screen 4','Dolby Atmos',88),
  ('Screen 5','4K Premium',88);

INSERT INTO public.movies (title, poster_url, genre, duration_min, language, rating, age_rating, description, cast_list, trailer_url, status, release_date) VALUES
  ('Interstellar','/images/posters/interstellar.jpg','Sci-Fi / Drama',169,'English',8.7,'UA','A team of explorers travel through a newly discovered wormhole in search of a new home for humanity, as time itself becomes the cruellest obstacle.','{"Matthew McConaughey","Anne Hathaway","Jessica Chastain","Michael Caine"}','https://www.youtube.com/watch?v=zSWdZVtXT7E','now_showing','2014-11-07'),
  ('Avengers: Endgame','/images/posters/endgame.jpg','Action / Adventure',181,'English',8.4,'UA','The remaining heroes make one final stand to undo the devastation and restore balance to the universe.','{"Robert Downey Jr.","Chris Evans","Scarlett Johansson","Mark Ruffalo"}','https://www.youtube.com/watch?v=TcMBFSGVi1c','now_showing','2019-04-26'),
  ('Inception','/images/posters/inception.jpg','Sci-Fi / Thriller',148,'English',8.8,'UA','A skilled thief who steals secrets from dreams is offered a chance at redemption: plant an idea inside a target''s mind.','{"Leonardo DiCaprio","Joseph Gordon-Levitt","Elliot Page","Tom Hardy"}','https://www.youtube.com/watch?v=YoHD9XEInc0','now_showing','2010-07-16'),
  ('Spider-Man: No Way Home','/images/posters/spiderman.jpg','Action / Fantasy',148,'English / Hindi',8.2,'UA','When a spell to erase his identity goes wrong, the web-slinger faces villains from across the multiverse.','{"Tom Holland","Zendaya","Benedict Cumberbatch","Jacob Batalon"}','https://www.youtube.com/watch?v=JfVOs4VSpmA','now_showing','2021-12-17'),
  ('Dune: Part Two','/images/posters/dune.jpg','Sci-Fi / Epic',166,'English',8.6,'UA','Paul Atreides unites with the Fremen to wage war against the conspirators who destroyed his family.','{"Timothee Chalamet","Zendaya","Rebecca Ferguson","Javier Bardem"}','https://www.youtube.com/watch?v=Way9Dexny3w','now_showing','2024-03-01'),
  ('Avatar: Fire and Ash','/images/posters/avatar.jpg','Sci-Fi / Adventure',175,'English',0.0,'UA','A new clan rises on Pandora as the Sully family is drawn into a conflict that spans ocean and flame.','{"Sam Worthington","Zoe Saldana","Sigourney Weaver"}','','coming_soon','2026-12-18'),
  ('The Nightwatch','/images/posters/detective.jpg','Crime / Thriller',142,'English',0.0,'A','A masked detective hunts a serial killer through the rain-soaked streets of a decaying city.','{"Robert Pattinson","Zoe Kravitz","Colin Farrell"}','','coming_soon','2026-10-02'),
  ('Final Reckoning','/images/posters/reckoning.jpg','Action / Spy',163,'English / Hindi',0.0,'UA','One last impossible mission stands between the world and total collapse.','{"Tom Cruise","Hayley Atwell","Simon Pegg"}','','coming_soon','2026-11-13');

INSERT INTO public.shows (movie_id, screen_id, show_date, show_time, base_price)
SELECT m.id, s.id, d::date, t.tm, t.price
FROM (
  SELECT id, row_number() OVER (ORDER BY release_date DESC) AS rn
  FROM public.movies WHERE status = 'now_showing'
) m
JOIN (
  SELECT id, row_number() OVER (ORDER BY name) AS rn FROM public.screens
) s ON s.rn = m.rn
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + 29, '1 day') AS d
CROSS JOIN (VALUES ('10:00'::time,180),('13:30'::time,220),('16:30'::time,250),('19:30'::time,300),('22:30'::time,260)) AS t(tm, price);