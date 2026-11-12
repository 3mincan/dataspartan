interface AnnouncerProps {
  message: string;
}

/**
 * The page's single polite live region (DESIGN.md § Names, states and
 * status). It must stay mounted: screen readers only announce changes to a
 * region that already exists.
 */
export function Announcer({ message }: AnnouncerProps) {
  return (
    <div role="status" className="visually-hidden">
      {message}
    </div>
  );
}
