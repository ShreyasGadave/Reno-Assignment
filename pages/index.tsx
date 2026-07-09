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
  image: string | null;
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

        {/* Notices Grid */}
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-12 text-center bg-card">
            <h3 className="text-lg font-semibold text-foreground mb-1">No notices posted yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Create your first announcement notice to make it visible on the board.
            </p>
            <button
              onClick={() => router.push("/notice/new")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Post a Notice
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
