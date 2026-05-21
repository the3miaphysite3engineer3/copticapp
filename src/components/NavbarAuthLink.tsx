"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient, hasSupabaseEnv } from "@/lib/supabase/client";
import { loadBrowserUser } from "@/lib/supabase/clientAuth";

import {
  getNavbarLinkClasses,
  type NavbarLinkVariant,
} from "./navbarLinkStyles";

import type { User } from "@supabase/supabase-js";

type NavbarAuthLinkProps = {
  dashboardHref: string;
  dashboardLabel: string;
  loginHref: string;
  loginLabel: string;
  onNavigate?: () => void;
  pathname: string;
  variant: NavbarLinkVariant;
};

export function NavbarAuthLink({
  dashboardHref,
  dashboardLabel,
  loginHref,
  loginLabel,
  onNavigate,
  pathname,
  variant,
}: NavbarAuthLinkProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    let isMounted = true;

    void loadBrowserUser(supabase)
      .then((nextUser) => {
        if (isMounted) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const href = user ? dashboardHref : loginHref;
  const label = user ? dashboardLabel : loginLabel;
  const hrefPathname = href.split("?")[0] ?? href;
  const isActive =
    pathname === hrefPathname || pathname.startsWith(`${hrefPathname}/`);
  const { linkClassName, labelClassName } = getNavbarLinkClasses({
    isActive,
    variant,
  });

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onNavigate}
      data-label={label}
      className={linkClassName}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={labelClassName}>{label}</span>
    </Link>
  );
}
