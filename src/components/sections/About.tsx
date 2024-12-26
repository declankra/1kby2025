// src/components/sections/About.tsx
export default function About() {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">About this Project</h2>
          <div className="max-w-3xl mx-auto text-left space-y-4">
            <p className="text-lg">
              At dkBuilds, the mission is simple: <span className="font-bold">build products that make many people smile</span>. 
              The north star metric for 2025 - <span className="font-semibold text-green-500">generating $1,000 in revenue</span> - isn&apos;t just about 
              the money; it&apos;s clear focus on our <span className="font-bold">commitment to building products that deliver value</span>.
            </p>
            <p className="text-lg">
              <span className="underline decoration-wavy decoration-green-500">Willingness to pay is the strongest indicator of solving real problems</span>.
              Following last year&apos;s success—where we focused on reaching 1,000 users and proved people want to use our products—this goal sets the stage for even bigger achievements.
            </p>
            <p className="text-lg">
              This page serves as (1) a public tracker towards our goal and (2) a POC for accepting payments through web applications 
              via Stripe. You can participate below or{' '}
              <a 
                href="https://github.com/declankra/1kby2025" 
                className="text-primary underline hover:text-primary/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                create your own version of this page using the public repository
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    );
  }