import type { Timeline } from "./types";

export const TIMELINES: Timeline[] = [
    {
        id: "tech-giants",
        theme: "Tech Giants",
        prompt: "Order these tech milestones from earliest to latest",
        themeEmoji: "💻",
        difficulty: "medium",
        events: [
            { id: "tg1", title: "First iPhone launch", emoji: "📱", year: 2007, fact: "Steve Jobs unveiled it on Jan 9, 2007." },
            { id: "tg2", title: "Google founded", emoji: "🔍", year: 1998, fact: "Larry Page & Sergey Brin founded it in a Menlo Park garage." },
            { id: "tg3", title: "Facebook goes public", emoji: "📊", year: 2012, fact: "The $104bn IPO was the biggest tech IPO at the time." },
            { id: "tg4", title: "YouTube launched", emoji: "▶️", year: 2005, fact: "First video was 'Me at the zoo' — 18 seconds long." },
            { id: "tg5", title: "TikTok launches globally", emoji: "🎵", year: 2018, fact: "ByteDance launched TikTok internationally in August 2018." },
            { id: "tg6", title: "Amazon founded", emoji: "📦", year: 1994, fact: "Bezos started it in his garage selling books." },
            { id: "tg7", title: "Instagram acquired by FB", emoji: "📷", year: 2012, fact: "Facebook bought Instagram for $1bn — widely mocked at the time." },
        ],
    },
    {
        id: "world-events",
        theme: "World History",
        prompt: "Order these historic events from earliest to latest",
        themeEmoji: "🌍",
        difficulty: "hard",
        events: [
            { id: "we1", title: "First Moon landing", emoji: "🌕", year: 1969, fact: "Apollo 11. Neil Armstrong stepped out at 02:56 UTC on July 21." },
            { id: "we2", title: "Berlin Wall falls", emoji: "🧱", year: 1989, fact: "November 9, 1989 — East Germany opened its borders." },
            { id: "we3", title: "World War I begins", emoji: "⚔️", year: 1914, fact: "Triggered by the assassination of Archduke Franz Ferdinand." },
            { id: "we4", title: "Nelson Mandela freed", emoji: "✊", year: 1990, fact: "Released Feb 11, 1990 after 27 years in prison." },
            { id: "we5", title: "Hiroshima atomic bomb", emoji: "☢️", year: 1945, fact: "August 6, 1945 — first wartime use of a nuclear weapon." },
            { id: "we6", title: "Cuban Missile Crisis", emoji: "🚀", year: 1962, fact: "13 days in October 1962 brought the world to nuclear brink." },
            { id: "we7", title: "9/11 attacks", emoji: "🗽", year: 2001, fact: "Nearly 3,000 killed in coordinated Al-Qaeda attacks." },
        ],
    },
    {
        id: "inventions",
        theme: "Great Inventions",
        prompt: "Order these inventions from earliest to latest",
        themeEmoji: "💡",
        difficulty: "hard",
        events: [
            { id: "in1", title: "Telephone invented", emoji: "☎️", year: 1876, fact: "Alexander Graham Bell patented it March 7, 1876." },
            { id: "in2", title: "World Wide Web created", emoji: "🌐", year: 1991, fact: "Tim Berners-Lee published the first website on Aug 6, 1991." },
            { id: "in3", title: "First email sent", emoji: "📧", year: 1971, fact: "Ray Tomlinson sent it to himself between two machines." },
            { id: "in4", title: "Television invented", emoji: "📺", year: 1927, fact: "Philo Farnsworth transmitted the first electronic TV image." },
            { id: "in5", title: "Penicillin discovered", emoji: "💊", year: 1928, fact: "Alexander Fleming noticed mould killing bacteria in a petri dish." },
            { id: "in6", title: "First airplane flight", emoji: "✈️", year: 1903, fact: "Wright Brothers at Kitty Hawk — 12 seconds, 37 metres." },
            { id: "in7", title: "GPS becomes public", emoji: "📡", year: 1983, fact: "Reagan opened GPS to civilian use after KAL 007 was shot down." },
        ],
    },
    {
        id: "pop-culture",
        theme: "Pop Culture",
        prompt: "Order these pop culture moments from earliest to latest",
        themeEmoji: "🎬",
        difficulty: "medium",
        events: [
            { id: "pc1", title: "Star Wars Episode IV released", emoji: "⭐", year: 1977, fact: "May 25, 1977 — changed blockbuster filmmaking forever." },
            { id: "pc2", title: "Michael Jackson's Thriller", emoji: "🕺", year: 1982, fact: "Released Nov 30, 1982 — best-selling album of all time." },
            { id: "pc3", title: "Harry Potter book 1 published", emoji: "🧙", year: 1997, fact: "Bloomsbury rejected it 12 times before publishing." },
            { id: "pc4", title: "Netflix founded", emoji: "🎥", year: 1997, fact: "Started as a DVD-by-mail service, not streaming." },
            { id: "pc5", title: "The Simpsons first airs", emoji: "🍩", year: 1989, fact: "December 17, 1989 — still running 35+ years later." },
            { id: "pc6", title: "Titanic film released", emoji: "🚢", year: 1997, fact: "First film to gross $1 billion. James Cameron directed." },
            { id: "pc7", title: "Minecraft released", emoji: "⛏️", year: 2011, fact: "Notch released v1.0 on Nov 18, 2011 at MineCon." },
        ],
    },
    {
        id: "space-race",
        theme: "Space Exploration",
        prompt: "Order these space milestones from earliest to latest",
        themeEmoji: "🚀",
        difficulty: "easy",
        events: [
            { id: "sr1", title: "Sputnik launched", emoji: "🛰️", year: 1957, fact: "October 4, 1957 — first artificial satellite, by the USSR." },
            { id: "sr2", title: "First human in space", emoji: "👨‍🚀", year: 1961, fact: "Yuri Gagarin orbited Earth once on April 12, 1961." },
            { id: "sr3", title: "Moon landing", emoji: "🌕", year: 1969, fact: "Apollo 11, July 20, 1969." },
            { id: "sr4", title: "Space Shuttle first flight", emoji: "🚀", year: 1981, fact: "Columbia launched April 12, 1981." },
            { id: "sr5", title: "Hubble Space Telescope", emoji: "🔭", year: 1990, fact: "Launched April 24, 1990 — revolutionised astronomy." },
            { id: "sr6", title: "Mars rover Curiosity lands", emoji: "🔴", year: 2012, fact: "August 6, 2012 — 'Seven minutes of terror' landing." },
            { id: "sr7", title: "James Webb Telescope launch", emoji: "🌌", year: 2021, fact: "December 25, 2021 — took 14 years and $10bn to build." },
        ],
    },
    {
        id: "science",
        theme: "Scientific Discoveries",
        prompt: "Order these scientific breakthroughs from earliest to latest",
        themeEmoji: "🔬",
        difficulty: "hard",
        events: [
            { id: "sc1", title: "DNA structure discovered", emoji: "🧬", year: 1953, fact: "Watson & Crick published in Nature on April 25, 1953." },
            { id: "sc2", title: "Theory of relativity", emoji: "⚡", year: 1905, fact: "Einstein published four groundbreaking papers in his 'miracle year'." },
            { id: "sc3", title: "Human genome mapped", emoji: "🗺️", year: 2003, fact: "Completed April 14, 2003 — 13 years, $3bn project." },
            { id: "sc4", title: "First black hole photo", emoji: "🕳️", year: 2019, fact: "Event Horizon Telescope released the image April 10, 2019." },
            { id: "sc5", title: "Higgs boson confirmed", emoji: "⚛️", year: 2012, fact: "CERN confirmed discovery July 4, 2012." },
            { id: "sc6", title: "First cloned animal (Dolly)", emoji: "🐑", year: 1996, fact: "Dolly the sheep was cloned at the Roslin Institute." },
            { id: "sc7", title: "Gravitational waves detected", emoji: "🌊", year: 2016, fact: "LIGO detected waves from two merging black holes." },
        ],
    },
    {
        id: "sports",
        theme: "Sports Moments",
        prompt: "Order these iconic sports moments from earliest to latest",
        themeEmoji: "🏆",
        difficulty: "medium",
        events: [
            { id: "sp1", title: "First modern Olympics", emoji: "🏅", year: 1896, fact: "Athens, Greece — 14 nations, 241 athletes, 43 events." },
            { id: "sp2", title: "Roger Bannister 4-min mile", emoji: "🏃", year: 1954, fact: "May 6, 1954 at Oxford — 3:59.4, once thought impossible." },
            { id: "sp3", title: "Pelé's first World Cup win", emoji: "⚽", year: 1958, fact: "17-year-old Pelé scored twice in the final vs Sweden." },
            { id: "sp4", title: "Ali vs Frazier 'Thrilla'", emoji: "🥊", year: 1975, fact: "Manila, October 1, 1975 — Ali won in the 14th round." },
            { id: "sp5", title: "Michael Jordan's last Bulls title", emoji: "🏀", year: 1998, fact: "The 'Last Dance' — game-winning shot vs Utah Jazz." },
            { id: "sp6", title: "Usain Bolt's 9.58s world record", emoji: "⚡", year: 2009, fact: "Berlin World Championships, August 16, 2009." },
            { id: "sp7", title: "Leicester City win Premier League", emoji: "🦊", year: 2016, fact: "5000-1 outsiders — the greatest underdog story in sport." },
        ],
    },
    {
        id: "internet-era",
        theme: "The Internet Age",
        prompt: "Order these internet milestones from earliest to latest",
        themeEmoji: "🌐",
        difficulty: "easy",
        events: [
            { id: "ie1", title: "First website goes live", emoji: "🌐", year: 1991, fact: "info.cern.ch — about the World Wide Web project itself." },
            { id: "ie2", title: "Wikipedia launches", emoji: "📖", year: 2001, fact: "January 15, 2001 — now has 60 million+ articles." },
            { id: "ie3", title: "Facebook founded", emoji: "👥", year: 2004, fact: "Launched from Mark Zuckerberg's Harvard dorm room." },
            { id: "ie4", title: "Twitter launches", emoji: "🐦", year: 2006, fact: "First tweet: 'just setting up my twttr' — Jack Dorsey." },
            { id: "ie5", title: "Snapchat launches", emoji: "👻", year: 2011, fact: "Launched as 'Picaboo' by Stanford students." },
            { id: "ie6", title: "ChatGPT launched", emoji: "🤖", year: 2022, fact: "Reached 1 million users in 5 days — fastest ever." },
            { id: "ie7", title: "Spotify launches", emoji: "🎧", year: 2008, fact: "Daniel Ek launched it in Sweden on October 7, 2008." },
        ],
    },
];

export function getRandomTimeline(excludeId?: string): Timeline {
    const pool = excludeId
        ? TIMELINES.filter((t) => t.id !== excludeId)
        : TIMELINES;
    return pool[Math.floor(Math.random() * pool.length)];
}

/** Returns events sorted ascending by year */
export function sortedEvents(timeline: Timeline) {
    return [...timeline.events].sort((a, b) => a.year - b.year);
}