"use client";

import { motion } from "motion/react";
import { Heart, MessageSquare } from "lucide-react";
import { useState } from "react";

const scrollbarHideStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

export default function Profile2() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "posts" | "comments" | "images"
  >("profile");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyles }} />
      <section className="w-full min-h-screen flex items-start lg:items-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            {/* Profile Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 p-2">
              {/* Header with Gradient Background */}
              <div className="relative h-32 sm:h-40 rounded-3xl bg-linear-to-br from-purple-400 via-purple-500 to-purple-600 dark:from-purple-500 dark:via-purple-600 dark:to-purple-700 overflow-hidden">
                {/* Decorative wave overlay */}
                <div className="absolute inset-0 opacity-30">
                  <svg
                    viewBox="0 0 1000 200"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,100 C150,150 350,50 500,100 C650,150 850,50 1000,100 L1000,0 L0,0 Z"
                      fill="white"
                      fillOpacity="0.3"
                    />
                  </svg>
                </div>

                {/* Icon button in top right */}
                <div className="absolute top-4 right-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                    aria-label="More options"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Profile Content Container */}
              <div className="relative px-4 pb-4">
                {/* Profile Picture & Stats Row */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
                  {/* Profile Picture */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-neutral-800 dark:bg-neutral-900 p-1.5 shadow-xl">
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <img
                          src="https://pbs.twimg.com/profile_images/1927474594102784000/Al0g-I6o_400x400.jpg"
                          alt="Profile picture"
                          className="w-full h-full rounded-full object-cover bg-neutral-700 dark:bg-neutral-800"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Stats & Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto"
                  >
                    {/* Stats */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                          12,099
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          Followers
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                          378
                        </div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          Following
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg bg-blue-600 dark:bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors duration-200">
                        Follow
                      </button>
                      <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-medium text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200">
                        Hire me
                      </button>
                      <button
                        className="w-9 h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
                        aria-label="Favorite"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </div>

                {/* User Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-6"
                >
                  {/* Name & Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                      Alex Rivera
                    </h1>
                    <span className="inline-flex items-center px-3 py-1 rounded-md bg-purple-100 dark:bg-neutral-800 text-purple-700 dark:text-purple-400 text-xs font-medium w-fit">
                      Full Stack Developer
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mb-3 leading-relaxed">
                    I specialise in React, Node.js, and building scalable web
                    applications
                  </p>

                  {/* Handle & Join Date */}
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    <span>@alexrivera</span>
                    <span>•</span>
                    <span>Full Stack Developer</span>
                    <span>•</span>
                    <span>Joined Jan 2020</span>
                  </div>
                </motion.div>

                {/* Tabs */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="border-b border-neutral-200 dark:border-neutral-800 mb-6 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  <div className="flex items-center gap-6 min-w-max">
                    <button
                      onClick={() => setActiveTab("profile")}
                      className={`pb-3 px-1 text-sm font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === "profile"
                          ? "border-blue-600 text-neutral-900 dark:text-white"
                          : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab("posts")}
                      className={`pb-3 px-1 text-sm font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === "posts"
                          ? "border-blue-600 text-neutral-900 dark:text-white"
                          : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveTab("comments")}
                      className={`pb-3 px-1 text-sm font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === "comments"
                          ? "border-blue-600 text-neutral-900 dark:text-white"
                          : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      }`}
                    >
                      Comments
                    </button>
                    <button
                      onClick={() => setActiveTab("images")}
                      className={`pb-3 px-1 text-sm font-medium transition-colors duration-200 border-b-2 whitespace-nowrap ${
                        activeTab === "images"
                          ? "border-blue-600 text-neutral-900 dark:text-white"
                          : "border-transparent text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      }`}
                    >
                      Images
                    </button>
                  </div>
                </motion.div>

                {/* Tab Content */}
                {activeTab === "profile" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {/* About Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                        About
                        <span className="text-lg">👋</span>
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        I&apos;m Alex Rivera, a Full Stack Developer passionate about
                        building fast, scalable, and user-friendly web
                        applications. I love solving complex technical
                        challenges and creating elegant solutions through clean
                        code. Always learning, I explore new frameworks and
                        technologies to build products that make a difference.
                      </p>
                    </div>

                    {/* Location & Social Media */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Location */}
                      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                          Location
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                          <span className="text-base">🇺🇸</span>
                          <span>San Francisco, CA</span>
                        </div>
                      </div>

                      {/* Social Media */}
                      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                          Social Media accounts
                        </h3>
                        <div className="flex items-center gap-3">
                          <a
                            href="#"
                            className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors duration-200"
                            aria-label="Facebook"
                          >
                            <span className="text-white text-sm font-bold">
                              f
                            </span>
                          </a>
                          <a
                            href="#"
                            className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center hover:bg-blue-800 transition-colors duration-200"
                            aria-label="LinkedIn"
                          >
                            <span className="text-white text-sm font-bold">
                              in
                            </span>
                          </a>
                          <a
                            href="#"
                            className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center hover:opacity-90 transition-opacity duration-200"
                            aria-label="Instagram"
                          >
                            <span className="text-white text-sm font-bold">
                              📷
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Skills Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium">
                          React
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium">
                          TypeScript
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium">
                          Node.js
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium">
                          PostgreSQL
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium">
                          +3
                        </span>
                      </div>
                    </div>

                    {/* Experience Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 sm:p-5">
                      <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                        Experience
                      </h3>
                      <div className="flex items-start gap-3">
                        {/* Company Logo */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-lg">
                            TC
                          </span>
                        </div>
                        {/* Job Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
                            Senior Full Stack Developer
                          </h4>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5">
                            <div>TechCorp, USA • Remote</div>
                            <div>Jan 2022 - Present • 2 yrs 3 mos</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "posts" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-12 text-center"
                  >
                    <p className="text-neutral-500 dark:text-neutral-500">
                      No posts yet
                    </p>
                  </motion.div>
                )}

                {activeTab === "comments" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-12 text-center"
                  >
                    <p className="text-neutral-500 dark:text-neutral-500">
                      No comments yet
                    </p>
                  </motion.div>
                )}

                {activeTab === "images" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-12 text-center"
                  >
                    <p className="text-neutral-500 dark:text-neutral-500">
                      No images yet
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
