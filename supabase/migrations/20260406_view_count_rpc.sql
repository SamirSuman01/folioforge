-- Migration: increment_view_count RPC
-- Called by /api/track (service role) on every portfolio page view.

CREATE OR REPLACE FUNCTION increment_view_count(p_portfolio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE portfolios
  SET view_count = view_count + 1
  WHERE id = p_portfolio_id;
END;
$$;
