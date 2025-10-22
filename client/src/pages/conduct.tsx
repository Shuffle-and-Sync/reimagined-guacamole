import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Header, Footer } from "@/shared/components";

export default function Conduct() {
  useDocumentTitle("Code of Conduct - Shuffle & Sync");
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Code of Conduct
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Creating a welcoming and inclusive community for everyone
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-users text-primary text-xl"></i>
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <p>
                We are committed to providing a friendly, safe, and welcoming
                environment for all, regardless of gender, sexual orientation,
                ability, ethnicity, socioeconomic status, and religion.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  1. Expected Behavior
                </h3>
                <p>
                  The following behaviors are expected and requested of all
                  community members:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Participate in an authentic and active way</li>
                  <li>
                    Exercise consideration and respect in your speech and
                    actions
                  </li>
                  <li>Attempt collaboration before conflict</li>
                  <li>
                    Refrain from demeaning, discriminatory, or harassing
                    behavior and speech
                  </li>
                  <li>
                    Be mindful of your surroundings and fellow participants
                  </li>
                  <li>
                    Alert community leaders if you notice violations of this
                    Code of Conduct
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  2. Unacceptable Behavior
                </h3>
                <p>
                  The following behaviors are considered harassment and are
                  unacceptable:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Violence, threats of violence, or violent language directed
                    against another person
                  </li>
                  <li>
                    Sexist, racist, homophobic, transphobic, ableist, or
                    otherwise discriminatory jokes and language
                  </li>
                  <li>
                    Posting or displaying sexually explicit or violent material
                  </li>
                  <li>
                    Personal insults, particularly those using discriminatory
                    terms
                  </li>
                  <li>Unwelcome sexual attention or advances</li>
                  <li>Deliberate intimidation, stalking, or following</li>
                  <li>
                    Advocating for or encouraging any of the above behavior
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  3. Gaming Community Guidelines
                </h3>
                <p>
                  Since Shuffle & Sync is a gaming platform, we have additional
                  guidelines specific to gaming interactions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>Fair Play:</strong> No cheating, exploiting, or
                    using unauthorized third-party software
                  </li>
                  <li>
                    <strong>Good Sportsmanship:</strong> Treat opponents and
                    teammates with respect, win or lose
                  </li>
                  <li>
                    <strong>Constructive Communication:</strong> Offer helpful
                    feedback rather than destructive criticism
                  </li>
                  <li>
                    <strong>Inclusive Gaming:</strong> Welcome new players and
                    help them learn
                  </li>
                  <li>
                    <strong>Respect Boundaries:</strong> Don&apos;t pressure
                    others to play beyond their comfort level
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  4. Consequences of Unacceptable Behavior
                </h3>
                <p>
                  Unacceptable behavior from any community member will not be
                  tolerated. Anyone asked to stop unacceptable behavior is
                  expected to comply immediately.
                </p>
                <p>
                  If a community member engages in unacceptable behavior, we may
                  take any action deemed appropriate, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Warning the offender</li>
                  <li>Temporary ban from the service</li>
                  <li>Permanent expulsion from the community</li>
                  <li>Reporting to relevant authorities when appropriate</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  5. Reporting Guidelines
                </h3>
                <p>
                  If you are subject to or witness unacceptable behavior, or
                  have any other concerns, please notify us as soon as possible:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email us at: admin@shuffleandsync.com</li>
                  <li>Use the in-app reporting system</li>
                  <li>Contact any community moderator or administrator</li>
                </ul>
                <p>
                  All complaints will be reviewed and investigated promptly and
                  fairly.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  6. Addressing Grievances
                </h3>
                <p>
                  If you feel you have been falsely or unfairly accused of
                  violating this Code of Conduct, you should notify us with a
                  concise description of your grievance.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  7. Scope
                </h3>
                <p>
                  This Code of Conduct applies to all community spaces,
                  including but not limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The Shuffle & Sync platform and games</li>
                  <li>Community forums and chat rooms</li>
                  <li>Social media interactions related to our community</li>
                  <li>Real-world events and meetups</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={handleGoHome} data-testid="button-back-home">
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
