import { Hexagon, Search, Bell } from 'lucide-react';

const navItems = ['Dashboard', 'Vendors', 'Requirements', 'Settings'];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-2.5">
          <Hexagon className="h-5 w-5 text-primary" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-foreground">SignalCore</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Vendor Intelligence
            </span>
          </div>
        </div>

        {/* Center: Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-full bg-card/60 border border-border px-1.5 py-1">
          {navItems.map((item) => (
            <button
              key={item}
              className={
                item === 'Dashboard'
                  ? 'rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary'
                  : 'rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right: Search + Bell + Avatar */}
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              disabled
              placeholder="Search..."
              className="h-8 w-44 rounded-md border border-border bg-card/60 pl-8 pr-10 text-xs text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          <button className="relative rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-purple-500" />
        </div>
      </div>
    </header>
  );
}
