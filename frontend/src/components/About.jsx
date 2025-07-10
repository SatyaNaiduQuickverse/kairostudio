import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Users, Award, Clock, Heart } from 'lucide-react';
import './About.css';

const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const stats = [
    { icon: Users, number: '150+', label: 'Happy Clients' },
    { icon: Award, number: '300+', label: 'Projects Done' },
    { icon: Clock, number: '5+', label: 'Years Experience' },
    { icon: Heart, number: '99%', label: 'Client Satisfaction' }
  ];

  return (
    <section id="about" className="about" ref={ref}>
      <div className="about-container">
        <div className="about-content">
          <motion.div 
            className="about-text"
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="about-title">
              About <span className="gradient-text">Kairos Studio</span>
            </h2>
            <p className="about-description">
              At Kairos Studio, we believe that the perfect moment to create something extraordinary is now. 
              Our team of passionate designers and developers work tirelessly to transform your vision into 
              reality, crafting digital experiences that stand the test of time.
            </p>
            <p className="about-description">
              Founded on the principle that great design should be both beautiful and functional, we've helped 
              businesses of all sizes elevate their brand presence and connect with their audiences in meaningful ways.
            </p>
            
            <motion.div 
              className="about-mission"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h3>Our Mission</h3>
              <p>
                To create timeless designs that inspire, engage, and drive results. We're not just building 
                websites or apps – we're crafting experiences that leave lasting impressions.
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            className="about-visual"
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="visual-element">
              <motion.div 
                className="floating-card"
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <div className="card-content">
                  <div className="card-icon">
                    <Clock />
                  </div>
                  <h4>Perfect Timing</h4>
                  <p>Every project delivered at the right moment</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="about-stats"
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="stat-item"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="stat-icon">
                <stat.icon />
              </div>
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default About;
