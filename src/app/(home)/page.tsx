"use client";
import styles from "./styles.module.scss";
import { Contribute } from "@/components/Contribute/Contribute";
import { LatestContributions } from "@/components/LatestContributions/LatestContributions";
import { ProjectDetails } from "@/components/ProjectDetails/ProjectDetails";
import { Navbar } from "@/components/Navbar/Navbar";


export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <Navbar />
      </div>

      <div className={styles.content}>
        <div className={styles.leftContent}>
          <Contribute />
          <ProjectDetails />
        </div>

        <div className={styles.rightContent}>
          <LatestContributions />
        </div>
      </div>
    </div>
  );
}
