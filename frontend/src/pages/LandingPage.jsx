import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaMicrochip, FaChartLine, FaCloudUploadAlt, FaArrowRight, FaPlayCircle,
  FaMoon, FaSun, FaBrain, FaFlask, FaRocket, FaGlobe, FaShieldAlt,
  FaLinkedin, FaTwitter, FaGithub, FaMapMarkerAlt, FaPhone, FaEnvelope
} from 'react-icons/fa';

// Premium 3D Illustrations
import chipDesign from '../assets/Chip.jpg';
import pcbDesign from '../assets/PCB.jpg';
import cloudChip from '../assets/hero.jpg';

// Animation Variants
const heroVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};
const headerVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

const floatingVariants = {
  hidden: { y: 40, opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: [0.16, 0.77, 0.47, 0.97]
    }
  })
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const scaleUp = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { 
      duration: 0.6, 
      ease: [0.16, 0.77, 0.47, 0.97]
    }
  }
};

const slideUp = {
  hidden: { y: 60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { 
      duration: 0.8, 
      ease: [0.16, 0.77, 0.47, 0.97]
    }
  }
};

function LandingPage() {
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false); 
  const [activeFeature, setActiveFeature] = useState(0);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const features = [
    {
      title: "AI-Driven Chip Design",
      description: "Our neural architecture optimization reduces power consumption by up to 40% while improving performance.",
      icon: <FaMicrochip className="text-4xl" />,
      image: chipDesign,
      color: "from-purple-600 to-indigo-600"
    },
    {
      title: "Next-Gen PCB Engineering",
      description: "Automated routing with signal integrity analysis that cuts design time in half.",
      icon: <FaChartLine className="text-4xl" />,
      image: pcbDesign,
      color: "from-amber-500 to-orange-600"
    },
    {
      title: "Cloud-Powered Simulation",
      description: "Run complex simulations 10x faster with our distributed cloud infrastructure.",
      icon: <FaCloudUploadAlt className="text-4xl" />,
      image: cloudChip,
      color: "from-blue-500 to-cyan-600"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    document.documentElement.classList.toggle('dark');
  };
  useEffect(() => {
        const handleScroll = () => {
            setIsHeaderScrolled(window.scrollY > 50); // CORRECTED: isHeaderScrolled state is updated here
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden ${theme === 'dark' ? 'dark bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      {/* Custom Styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .text-gradient {
          background: linear-gradient(90deg, #8a2be2, #e032e0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bg-glass {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(255, 255, 255, 0.08);
        }
        .feature-card:hover .feature-image {
          transform: translateY(-10px) scale(1.05);
        }
        .parallax-bg {
          will-change: transform;
        }
      `}</style>
      {/* Header */}
            <motion.header
                initial="hidden"
                animate="visible"
                variants={headerVariants}
                className={`fixed w-full top-0 left-0 z-50 py-4 px-6 md:px-12 ${isHeaderScrolled ? (theme === 'dark' ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md' : 'bg-gray-100 bg-opacity-90 backdrop-blur-md border-b border-gray-200') : 'bg-transparent'}`}
            >
                <div className="container mx-auto flex justify-between items-center">
                    {/* Logo (no BackButton on LandingPage) */}
                    <Link to="/" className={`flex items-center text-3xl font-extrabold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        <svg className="w-9 h-9 mr-2 text-highlight-gradient" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
                        </svg>
                        <span className="text-highlight-gradient">SILICON AI</span>
                        <span className={`block text-xs font-normal -mt-1 ml-1 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>TECHNOLOGIES</span>
                    </Link>

                    {/* Auth Button & Theme Toggle */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors duration-200 focus:outline-none`}
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
                        </button>
                        <Link
                            to="/Authpage"
                            className="btn-gradient text-white font-semibold py-2 px-6 rounded-full shadow-lg"
                        >
                            Login / Sign Up
                        </Link>
                    </div>
                </div>
            </motion.header>

      {/* Hero Section - Apple Style */}
      <section className="relative h-screen overflow-hidden">
        <motion.div 
          className="absolute inset-0 parallax-bg"
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(ellipse at center, #1e1b4b 0%, #0f172a 70%, #020617 100%)'
              : 'radial-gradient(ellipse at center, #f5f3ff 0%, #e0e7ff 70%, #bfdbfe 100%)',
            y: yBg
          }}
        />
        
        <div className="relative z-10 h-full flex items-center justify-center px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={heroVariants}
            className="max-w-6xl mx-auto text-center"
          >
            <motion.div variants={floatingVariants} custom={0}>
              <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md text-sm font-medium mb-6">
                The Future of EDA is Here
              </span>
            </motion.div>
            
            <motion.h1 
              variants={floatingVariants}
              custom={1}
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            >
              <span className="text-gradient">Reimagine</span> Electronic Design
            </motion.h1>
            
            <motion.p 
              variants={floatingVariants}
              custom={2}
              className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90 mb-12"
            >
              AI-powered tools that transform how chips and PCBs are designed, simulated, and manufactured.
            </motion.p>
            
            <motion.div variants={floatingVariants} custom={3} className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Free Trial <FaArrowRight />
              </Link>
              <button
                onClick={() => {}}
                className="px-8 py-4 bg-transparent border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaPlayCircle /> Watch Demo
              </button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"
        />
      </section>

      {/* Features Carousel - Nike Style */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gradient">Why</span> Silicon AI?
            </h2>
            <p className="text-xl opacity-80 max-w-3xl mx-auto">
              We're redefining electronic design automation with cutting-edge AI and cloud technologies.
            </p>
          </motion.div>

          <div className="relative h-[600px]">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: activeFeature === index ? 1 : 0.2,
                  scale: activeFeature === index ? 1 : 0.9
                }}
                transition={{ duration: 0.8, ease: [0.16, 0.77, 0.47, 0.97] }}
                className={`absolute inset-0 flex flex-col md:flex-row items-center justify-center gap-12 transition-colors duration-500 ${activeFeature === index ? 'z-10' : 'z-0'}`}
              >
                <motion.div 
                  className="w-full md:w-1/2"
                  animate={{
                    y: activeFeature === index ? 0 : 40
                  }}
                >
                  <motion.h3 
                    className="text-3xl md:text-5xl font-bold mb-6"
                    animate={{
                      opacity: activeFeature === index ? 1 : 0.5
                    }}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p 
                    className="text-xl mb-8 max-w-lg"
                    animate={{
                      opacity: activeFeature === index ? 1 : 0
                    }}
                  >
                    {feature.description}
                  </motion.p>
                  <motion.div
                    animate={{
                      opacity: activeFeature === index ? 1 : 0,
                      y: activeFeature === index ? 0 : 20
                    }}
                  >
                    <Link
                      to="/features"
                      className={`inline-block px-6 py-3 rounded-full bg-gradient-to-r ${feature.color} text-white font-medium`}
                    >
                      Learn More
                    </Link>
                  </motion.div>
                </motion.div>
                
                <motion.div 
                  className="w-full md:w-1/2 flex justify-center"
                  animate={{
                    scale: activeFeature === index ? 1 : 0.8,
                    rotate: activeFeature === index ? 0 : -5
                  }}
                >
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className="max-h-[400px] object-contain transition-transform duration-500"
                  />
                </motion.div>
              </motion.div>
            ))}
            
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 z-20">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all ${activeFeature === index ? 'bg-purple-500 w-6' : 'bg-white/30'}`}
                  aria-label={`View feature ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions - Apple Style */}
      <section className="py-28 px-6 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <FaBrain className="text-5xl text-purple-400" />,
                title: "AI Optimization",
                description: "Machine learning algorithms that continuously improve your designs"
              },
              {
                icon: <FaRocket className="text-5xl text-amber-400" />,
                title: "10x Faster",
                description: "Cloud acceleration delivers unprecedented simulation speeds"
              },
              {
                icon: <FaShieldAlt className="text-5xl text-blue-400" />,
                title: "Enterprise Security",
                description: "Military-grade encryption for your intellectual property"
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={scaleUp}
                className="bg-glass p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="mb-6">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-lg opacity-80">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Nike Style */}
      <section className="relative py-40 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          variants={slideUp}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            Ready to Transform Your Design Process?
          </h2>
          <p className="text-xl md:text-2xl opacity-90 mb-12 max-w-3xl mx-auto">
            Join thousands of engineers revolutionizing electronics design with Silicon AI.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Free Trial <FaArrowRight />
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-transparent border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              Contact Sales
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center text-2xl font-bold mb-6">
              <span className="text-gradient">SILICON AI</span>
            </div>
            <p className="opacity-80 mb-6">
              The future of electronic design automation powered by AI.
            </p>
            <div className="flex gap-4">
              <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <FaLinkedin className="text-xl" />
              </a>
              <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <FaTwitter className="text-xl" />
              </a>
              <a href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <FaGithub className="text-xl" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Product</h4>
            <ul className="space-y-3 opacity-80">
              <li><a href="#" className="hover:text-purple-400 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Releases</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-3 opacity-80">
              <li><a href="#" className="hover:text-purple-400 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Press</a></li>
              <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-lg mb-6">Contact</h4>
            <address className="not-italic space-y-3 opacity-80">
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-purple-400" />
                <span>123 Tech Valley, San Francisco</span>
              </div>
              <div className="flex items-center gap-3">
                <FaPhone className="text-purple-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-purple-400" />
                <span>info@siliconai.com</span>
              </div>
            </address>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-white/10 text-center opacity-70">
          <p>&copy; {new Date().getFullYear()} Silicon AI Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;