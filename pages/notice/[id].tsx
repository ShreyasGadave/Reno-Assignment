import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { prisma } from "@/lib/prisma";
import NoticeForm from "@/components/NoticeForm";

interface Notice {
  id: string;
  title: string;
  body: string;
  category: "Exam" | "Event" | "General";
  priority: "Normal" | "Urgent";
  publishDate: string;
  image: string | null;
}

interface EditNoticeProps {
  notice: Notice;
}

export default function EditNotice({ notice }: EditNoticeProps) {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    const res = await fetch(`/api/notices/${notice.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update notice");
    }

    // Redirect to home on success
    router.push("/");
  };

  return (
    <>
      <Head>
        <title>Notice Board | Edit Notice</title>
      </Head>

      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Edit Notice
          </h1>
          <p className="text-muted-foreground text-sm">
            Modify the details of the notice below and save your changes.
          </p>
        </div>

        <NoticeForm
          initialData={notice}
          onSubmit={handleSubmit}
          buttonText="Update Notice"
        />
      </div>
    </>
  );
}

export async function getServerSideProps(context: any) {
  try {
    const { id } = context.params;

    if (!id || typeof id !== "string") {
      return { notFound: true };
    }

    const noticeData = await prisma.notice.findUnique({
      where: { id },
    });

    if (!noticeData) {
      return { notFound: true };
    }

    const notice = JSON.parse(JSON.stringify(noticeData));

    return {
      props: {
        notice,
      },
    };
  } catch (error) {
    console.error("Error loading notice in getServerSideProps:", error);
    return { notFound: true };
  }
}
