"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";

export const StoreSearch = ({ initial }: { initial: string }) => {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const term = value.trim();
        router.push(term ? `/stores?searchTerm=${encodeURIComponent(term)}` : "/stores");
      }}
      className="flex w-full max-w-sm gap-2"
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search stores…"
        aria-label="Search stores"
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
};
