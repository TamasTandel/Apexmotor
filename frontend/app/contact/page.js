"use client";
import ContactForm from "../../components/ContactForm";
import Reveal from "../../components/Reveal";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <Reveal className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
                <p className="text-gray-400 mb-12 text-center max-w-2xl mx-auto">
                    Questions, bookings, or feedback? Send us a message and we’ll get back within 1 business day.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-800">
                            <ContactForm />
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-6">
                            <h3 className="text-xl font-semibold mb-4 text-white">Reach us directly</h3>
                            <ul className="space-y-4 text-gray-300">
                                <li className="flex flex-col">
                                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Name</span>
                                    <span className="font-medium">AutoHub Sales & Support</span>
                                </li>
                                <li className="flex flex-col">
                                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Email</span>
                                    <a href="mailto:admin@123.com" className="text-blue-400 hover:text-blue-300 transition-colors">admin@123.com</a>
                                </li>
                                <li className="flex flex-col">
                                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Phone</span>
                                    <a href="tel:9313168851" className="text-blue-400 hover:text-blue-300 transition-colors">9313168851</a>
                                </li>
                                <li className="flex flex-col">
                                    <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Location</span>
                                    <span>amalsad , navsari , gujrat</span>
                                </li>
                            </ul>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <a href="mailto:admin@123.com" className="flex items-center justify-center px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-[1.02] active:scale-95">
                                    Email
                                </a>
                                <a href="tel:9313168851" className="flex items-center justify-center px-4 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 font-medium transition-colors">
                                    Call
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </Reveal>
        </div>
    );
}
