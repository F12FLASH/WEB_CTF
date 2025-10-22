import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
} from "lucide-react";
import type { Announcement } from "@shared/schema";

const SEEN_ANNOUNCEMENTS_KEY = "seen_announcements";

export function AnnouncementPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [unseenAnnouncements, setUnseenAnnouncements] = useState<Announcement[]>([]);
  const [animateContent, setAnimateContent] = useState(true);

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  useEffect(() => {
    if (!announcements || announcements.length === 0) return;

    const seenIds = JSON.parse(localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY) || "[]");
    const unseen = announcements.filter(
      (announcement) => !seenIds.includes(announcement.id)
    );

    if (unseen.length > 0) {
      setUnseenAnnouncements(unseen);
      setCurrentAnnouncementIndex(0);
      setIsOpen(true);
    }
  }, [announcements]);

  const markCurrentAsRead = () => {
    const currentAnnouncement = unseenAnnouncements[currentAnnouncementIndex];
    const seenIds = JSON.parse(localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY) || "[]");
    
    if (!seenIds.includes(currentAnnouncement.id)) {
      seenIds.push(currentAnnouncement.id);
      localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(seenIds));
    }
  };

  const handleNext = () => {
    markCurrentAsRead();
    setAnimateContent(false);
    setTimeout(() => {
      if (currentAnnouncementIndex < unseenAnnouncements.length - 1) {
        setCurrentAnnouncementIndex(currentAnnouncementIndex + 1);
        setAnimateContent(true);
      } else {
        setIsOpen(false);
        setUnseenAnnouncements([]);
      }
    }, 200);
  };

  const handleSkipToEnd = () => {
    const seenIds = JSON.parse(localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY) || "[]");
    unseenAnnouncements.forEach((announcement) => {
      if (!seenIds.includes(announcement.id)) {
        seenIds.push(announcement.id);
      }
    });
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(seenIds));
    setIsOpen(false);
    setUnseenAnnouncements([]);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setUnseenAnnouncements([]);
  };

  if (!unseenAnnouncements || unseenAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = unseenAnnouncements[currentAnnouncementIndex];

  const getTheme = (type: string) => {
    switch (type) {
      case "warning":
        return {
          gradient: "from-amber-500 to-orange-600",
          lightBg: "from-amber-500/10 to-orange-500/10",
          icon: AlertTriangle,
          iconBg: "from-amber-500 to-orange-600",
          badgeClass: "bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg shadow-amber-500/30",
        };
      case "success":
        return {
          gradient: "from-green-500 to-emerald-600",
          lightBg: "from-green-500/10 to-emerald-500/10",
          icon: CheckCircle2,
          iconBg: "from-green-500 to-emerald-600",
          badgeClass: "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg shadow-green-500/30",
        };
      case "error":
        return {
          gradient: "from-red-500 to-rose-600",
          lightBg: "from-red-500/10 to-rose-500/10",
          icon: XCircle,
          iconBg: "from-red-500 to-rose-600",
          badgeClass: "bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 shadow-lg shadow-red-500/30",
        };
      default:
        return {
          gradient: "from-blue-500 to-cyan-600",
          lightBg: "from-blue-500/10 to-cyan-500/10",
          icon: Info,
          iconBg: "from-blue-500 to-cyan-600",
          badgeClass: "bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-lg shadow-blue-500/30",
        };
    }
  };

  const theme = getTheme(currentAnnouncement.type);
  const Icon = theme.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-0 shadow-2xl">
        <VisuallyHidden>
          <DialogTitle>{currentAnnouncement.title}</DialogTitle>
          <DialogDescription>{currentAnnouncement.message}</DialogDescription>
        </VisuallyHidden>
        <div className="relative">
          {/* Decorative gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${theme.lightBg} opacity-50`} />
          
          {/* Main content */}
          <div className="relative p-8 space-y-6">
            {/* Header with icon and title */}
            <div className="flex items-start gap-6">
              <div className={`flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-xl animate-bounce-in`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              
              <div className="flex-1 space-y-3 pt-1">
                <h2 
                  className={`text-3xl font-bold ${animateContent ? 'animate-slide-in-right' : 'opacity-0'}`}
                  data-testid="text-announcement-title"
                >
                  {currentAnnouncement.title}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={theme.badgeClass} data-testid="badge-announcement-type">
                    {currentAnnouncement.type}
                  </Badge>
                  {unseenAnnouncements.length > 1 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex gap-1" data-testid="announcement-progress-dots">
                        {unseenAnnouncements.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentAnnouncementIndex
                                ? `w-6 bg-gradient-to-r ${theme.gradient}`
                                : idx < currentAnnouncementIndex
                                ? "w-1.5 bg-muted-foreground/50"
                                : "w-1.5 bg-muted-foreground/20"
                            }`}
                            data-testid={`progress-dot-${idx}`}
                          />
                        ))}
                      </div>
                      <span className="font-medium" data-testid="text-announcement-counter">
                        {currentAnnouncementIndex + 1} / {unseenAnnouncements.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message content */}
            <div className={`bg-card rounded-xl p-6 border-2 shadow-inner ${animateContent ? 'animate-fade-in' : 'opacity-0'}`}>
              <p 
                className="text-lg leading-relaxed whitespace-pre-wrap"
                data-testid="text-announcement-message"
              >
                {currentAnnouncement.message}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button 
                variant="ghost" 
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-announcement-dismiss"
              >
                Remind me later
              </Button>
              
              <div className="flex gap-3">
                {unseenAnnouncements.length > 1 && currentAnnouncementIndex < unseenAnnouncements.length - 1 && (
                  <Button 
                    variant="outline" 
                    onClick={handleNext}
                    className="gap-2 hover:gap-3 transition-all"
                    data-testid="button-announcement-next"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  onClick={currentAnnouncementIndex === unseenAnnouncements.length - 1 ? handleNext : handleSkipToEnd}
                  className={`bg-gradient-to-r ${theme.gradient} hover:opacity-90 transition-opacity shadow-lg min-w-24`}
                  data-testid="button-announcement-confirm"
                >
                  {currentAnnouncementIndex === unseenAnnouncements.length - 1
                    ? "Got it!"
                    : `Skip to end`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
