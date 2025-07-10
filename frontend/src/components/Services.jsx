import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Palette, Monitor, Zap, Layers, Camera, Wand2 } from 'lucide-react';
import './Services.css';

const Services = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const services = [
    {
      icon: Palette,
      title: 'Brand Identity',
      description: 'Creating memorable visual identities that tell your story and connect with your audience.',
      color: '#ff6b6b'
    },
    {
      icon: Monitor,
      title: 'Web Design',
      description: 'Responsive, beautiful websites that deliver exceptional user experiences across all devices.',
      color: '#4ecdc4'
    },
    {
      icon: Zap,
      title: 'Digital Strategy',
      description: 'Strategic planning and execution to maximize your digital presence and growth.',
      color: '#45b7d1'
    },
    {
      icon: Layers,
      title: 'UI/UX Design',
      description: 'Intuitive interfaces that delight users and drive engagement through thoughtful design.',
      color: '#96ceb4'
    },
    {
      icon: Camera,
      title: 'Visual Content',
      description: 'Stunning photography and videography that captures the essence of your brand.',
      color: '#feca57'
    },
    {
      icon: Wand2,
      title: 'Motion Graphics',
      description: 'Bringing ideas to life through captivating animations and motion design.',
      color: '#ff9ff3'
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section id="services" className="services" ref={ref}>
      <div className="services-container">
        <motion.div 
          className="services-header"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="services-title">
            Our <span className="gradient-text">Services</span>
          </h2>
          <p className="services-subtitle">
            We craft digital experiences that transcend expectations and drive results
          </p>
        </motion.div>

        <motion.div 
          className="services-grid"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {services.map((service, index) => (
            <motion.div 
              key={service.title}
              className="service-card"
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <div className="service-icon-wrapper">
                <motion.div 
                  className="service-icon"
                  style={{ color: service.color }}
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1,
                    transition: { duration: 0.5 }
                  }}
                >
                  <service.icon />
                </motion.div>
              </div>
              
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              
              <motion.div 
                className="service-hover-effect"
                style={{ background: `linear-gradient(45deg, ${service.color}20, transparent)` }}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Services;