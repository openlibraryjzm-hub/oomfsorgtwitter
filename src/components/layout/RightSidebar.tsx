'use client';

import React from 'react';

export default function RightSidebar() {
  return (
    <aside className="w-[290px] xl:w-[350px] hidden lg:flex flex-col justify-end py-6 pl-6 pr-4 sticky top-0 h-screen select-none shrink-0">
      {/* Footer info links */}
      <footer className="px-4 text-[11px] text-[#536471] flex flex-wrap gap-x-2 gap-y-1">
        <a href="#" className="hover:underline">Terms of Service</a>
        <span>·</span>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <span>·</span>
        <span>© 2026 oomfs.org</span>
      </footer>
    </aside>
  );
}
