export type NavbarLinkVariant = "desktop" | "mobile";

type NavbarLinkClassOptions = {
  isActive: boolean;
  variant: NavbarLinkVariant;
};

const NAVBAR_LINK_BASE_CLASSES =
  "group whitespace-nowrap text-center text-sm tracking-[0.02em] transition-all duration-200 before:invisible before:col-start-1 before:row-start-1 before:h-0 before:overflow-hidden before:font-semibold before:content-[attr(data-label)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

const NAVBAR_LINK_STATE_CLASSES = {
  active:
    "bg-accent-soft text-accent-strong dark:bg-accent-soft/35 dark:text-accent",
  idle: "text-muted hover:bg-elevated hover:text-ink",
};

const NAVBAR_LINK_VARIANT_CLASSES = {
  desktop: "inline-grid h-10 items-center justify-items-center rounded-lg px-4",
  mobile: "grid justify-items-center rounded-lg px-4 py-3",
};

export function getNavbarLinkClasses({
  isActive,
  variant,
}: NavbarLinkClassOptions) {
  return {
    labelClassName: `col-start-1 row-start-1 ${
      isActive ? "font-semibold" : "font-medium group-hover:font-semibold"
    }`,
    linkClassName: `${NAVBAR_LINK_BASE_CLASSES} ${
      NAVBAR_LINK_VARIANT_CLASSES[variant]
    } ${
      isActive
        ? NAVBAR_LINK_STATE_CLASSES.active
        : NAVBAR_LINK_STATE_CLASSES.idle
    }`,
  };
}
