export const metadata = { title: 'About | AutoHub' };

export default function AboutPage() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">About AutoHub</h1>
      <p>AutoHub is a modern platform designed to streamline every step of the car ownership journey—from discovering the right vehicle to financing, servicing, and selling. Our mission is to bring transparency and simplicity to automotive transactions.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">What We Offer</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Curated inventory of quality vehicles</li>
        <li>Fast & flexible finance applications</li>
        <li>Service booking with trusted technicians</li>
        <li>Simple selling and account management tools</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Our Vision</h2>
      <p>We believe buying or selling a car shouldn&apos;t be stressful. By combining clean design, data-driven tools, and a customer-first mindset, we&apos;re building a platform that empowers drivers and dealers alike.</p>
    </div>
  );
}
