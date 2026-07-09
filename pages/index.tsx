import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { prisma } from "@/lib/prisma";
import NoticeCard from "@/components/NoticeCard";

interface Notice {
  id: string;
  title: string;
  body: string;
  category: "Exam" | "Event" | "General";
  priority: "Normal" | "Urgent";
  publishDate: string;
  imageUrl: string | null;
  imagePublicId: string | null;
}

interface HomeProps {
  notices: Notice[];
}

export default function Home({ notices }: HomeProps) {
  const router = useRouter();

  // Function to refresh server side props after deletion
  const handleRefresh = () => {
    router.replace(router.asPath);
  };

  return (
    <>
      <Head>
        <title>Notice Board | Active Notices</title>
      </Head>

      <div className="space-y-6">
        {/* Page title and description */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Active Notices
          </h1>
          <p className="text-muted-foreground text-sm">
            Stay updated with the latest announcements, events, and schedules.
          </p>
        </div>

        {/* Notices Cards Grid */}
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-card rounded-2xl border border-border shadow-sm text-center">
            <svg
              className="size-16 text-muted-foreground/40 mb-4 stroke-[1.25]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-foreground">No active notices found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              There are currently no announcements. Check back later or add a new one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onDeleteSuccess={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export async function getServerSideProps() {
  try {
    // Database query: 1. Urgent first, then Normal, 2. Secondary order by publishDate descending
    const noticesData = await prisma.notice.findMany({
      orderBy: [
        { priority: "desc" },
        { publishDate: "desc" },
      ],
    });

    // Serialize Date objects for Next.js props
    const notices = JSON.parse(JSON.stringify(noticesData));

    return {
      props: {
        notices,
      },
    };
  } catch (error) {
    console.error("Error fetching notices in getServerSideProps:", error);
    return {
      props: {
        notices: [],
      },
    };
  }
}
