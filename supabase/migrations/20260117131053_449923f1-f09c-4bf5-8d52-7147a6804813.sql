-- Content Creation: categories, content types, and content items

-- 1) Categories
CREATE TABLE IF NOT EXISTS public.content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_categories_select_authenticated"
ON public.content_categories
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "content_categories_mutate_assist_admin"
ON public.content_categories
FOR ALL
USING (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- 2) Content Types
CREATE TABLE IF NOT EXISTS public.content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_types_select_authenticated"
ON public.content_types
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "content_types_mutate_assist_admin"
ON public.content_types
FOR ALL
USING (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- 3) Content Items (what Assist creates)
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.content_categories(id) ON DELETE RESTRICT,
  content_type_id UUID NOT NULL REFERENCES public.content_types(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  image_primary_url TEXT,
  image_second_url TEXT,
  image_third_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_business_id ON public.content_items(business_id);
CREATE INDEX IF NOT EXISTS idx_content_items_category_id ON public.content_items(category_id);
CREATE INDEX IF NOT EXISTS idx_content_items_content_type_id ON public.content_items(content_type_id);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Business owners can view content items for their business.
-- Assist/admin can view all.
CREATE POLICY "content_items_select_assist_or_owner"
ON public.content_items
FOR SELECT
USING (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = content_items.business_id
      AND b.user_id = auth.uid()
  )
);

-- Only assist/admin can create content items (created_by must be the current user)
CREATE POLICY "content_items_insert_assist_admin"
ON public.content_items
FOR INSERT
WITH CHECK (
  (
    public.has_role(auth.uid(), 'assist'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  AND created_by = auth.uid()
);

-- Only assist/admin can update
CREATE POLICY "content_items_update_assist_admin"
ON public.content_items
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Only assist/admin can delete
CREATE POLICY "content_items_delete_assist_admin"
ON public.content_items
FOR DELETE
USING (
  public.has_role(auth.uid(), 'assist'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
);

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS trg_content_items_updated_at ON public.content_items;
CREATE TRIGGER trg_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
