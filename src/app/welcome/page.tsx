import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BookOpen, DollarSign, Eye, Megaphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function WelcomePage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-primary" />,
      title: 'Create & Sell Courses',
      description: 'Share your knowledge with the world. Create courses and sell them in our marketplace.',
    },
    {
      icon: <Eye className="w-8 h-8 text-primary" />,
      title: 'Earn by Watching',
      description: 'Watch short ads from our business partners to earn points, and use them to unlock new courses.',
    },
    {
      icon: <Megaphone className="w-8 h-8 text-primary" />,
      title: 'Promote Your Business',
      description: 'Are you a business owner? Create ad campaigns to reach a dedicated and engaged audience.',
    },
    {
      icon: <DollarSign className="w-8 h-8 text-primary" />,
      title: 'Gain Insights',
      description: 'Track your ad performance and get rewarded with points as more users view your content.',
    },
  ];

  return (
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6024568817887379"
     crossorigin="anonymous"></script>
    
    <div className="flex flex-col items-center">
      <section className="w-full relative">
        <div className="absolute inset-0 bg-primary/10" />
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover opacity-20"
            priority
          />
        )}
        <div className="container mx-auto px-4 py-24 sm:py-32 lg:py-40 relative text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-foreground">
            Learn, Earn, and Grow with <span className="text-primary">Unite</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            A unique platform where knowledge meets opportunity. Create and buy courses using points earned from watching ads, or promote your business to a captive audience.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="font-bold">
              <Link href="/signup-user">Start Learning</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-bold bg-background/80 backdrop-blur-sm">
              <Link href="/signup-business">Advertise with Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-headline font-bold tracking-tight">How It Works</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Whether you're a student, an instructor, or a business, Unite has something for you.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4 font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="w-full py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Unite. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
