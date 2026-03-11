import { useEffect, useState } from "react";

interface Props {
  suffix?: string;
  className?: string;
}

export default function VersionTag({ suffix, className }: Props) {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.github.com/repos/gentritbiba/cogpit/releases/latest")
      .then((r) => r.json())
      .then((data) => {
        if (data.tag_name) {
          setVersion(data.tag_name.replace(/^v/, ""));
        }
      })
      .catch(() => {});
  }, []);

  if (!version) return null;

  return (
    <span className={className}>
      v{version}{suffix ? ` ${suffix}` : ""}
    </span>
  );
}
