const paths = {
  drop: "M12 2C9 6 4 11 4 15a8 8 0 0 0 16 0c0-4-5-9-8-13Z M8 15a4 4 0 0 0 4 4",
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  camera: "M3 7h4l2-3h6l2 3h4v14H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  pin: "M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  report: "M6 2h8l5 5v15H6z M14 2v6h5 M9 12h7 M9 16h5",
  arrow: "M4 12h15 M14 6l6 6-6 6",
  book: "M3 4q5-2 9 1 4-3 9-1v15q-5-2-9 1-4-3-9-1z M12 5v15",
  wave: "M2 8q3-4 7-1t7 0t6 0 M2 14q3-4 7-1t7 0t6 0 M2 20q3-4 7-1t7 0t6 0",
  compass: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M15.5 8.5l-2 5-5 2 2-5z",
};
export type IconName = keyof typeof paths;
export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
