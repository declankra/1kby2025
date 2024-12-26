// src/components/layout/Footer.tsx
import { 
  IconBrandTwitter, 
  IconBrandLinkedin, 
  IconBrandProducthunt, 
  IconBrandReddit,
  IconBrandGithub
} from '@tabler/icons-react';

const SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/declan-kramper/',
    icon: IconBrandLinkedin,
  },
  {
    name: 'Product Hunt',
    href: 'https://www.producthunt.com/@declan_kramper/',
    icon: IconBrandProducthunt,
  },
  {
    name: 'GitHub',
    href: 'https://github.com/declankra/',
    icon: IconBrandGithub,
  },
  {
    name: 'Reddit',
    href: 'https://www.reddit.com/user/dkbuilds/',
    icon: IconBrandReddit,
  },
  {
    name: 'Twitter',
    href: 'https://x.com/asbestostrades',
    icon: IconBrandTwitter,
  },
] as const;

export default function Footer() {
  return (
    <footer className="mt-auto py-6 border-t">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <a 
            href="https://declankramper.me" 
            className="text-md text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built by <span className="text-green-500 hover:text-green-500/80">Declan</span>
          </a>
          <div className="flex gap-4">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
              >
                <link.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}