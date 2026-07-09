import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import NoticeForm from "@/components/NoticeForm";

export default function NewNotice() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    const res = await fetch("/api/notices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create notice");
    }

    // Redirect to home on success
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Notice Board | Add Notice</title>
      </Head>

      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Add Notice
          </h1>
          <p className="text-muted-foreground text-sm">
            Fill out the form below to publish a new notice to the board.
          </p>
        </div>

        <NoticeForm
          onSubmit={handleSubmit}
          buttonText="Save Notice"
        />
      </div>
    </>
  );
}
