const express = require('express');
const router = express.Router();

// CBSE Class 10 Content Data
const subjectsData = {
    'science': {
        name: 'Science',
        chapters: {
            'light': {
                id: 'light',
                name: 'Light - Reflection and Refraction',
                description: 'Understanding the behavior of light, mirrors, and lenses',
                summary: 'This chapter covers the fundamental concepts of light, including reflection from plane and spherical mirrors, refraction through various media, and the working of optical instruments like microscopes and telescopes.'
            },
            'carbon-compounds': {
                id: 'carbon-compounds',
                name: 'Carbon and its Compounds',
                description: 'Organic chemistry basics and carbon compounds',
                summary: 'Learn about the unique properties of carbon, covalent bonding, and various organic compounds including hydrocarbons, alcohols, and carboxylic acids.'
            },
            'life-processes': {
                id: 'life-processes',
                name: 'Life Processes',
                description: 'Nutrition, respiration, transportation, and excretion in living organisms',
                summary: 'Explore the essential life processes that maintain life in organisms, including nutrition in plants and animals, respiration, circulation, and waste removal.'
            },
            'heredity': {
                id: 'heredity',
                name: 'Heredity and Evolution',
                description: 'Genetics, inheritance patterns, and evolutionary concepts',
                summary: 'Understand how traits are passed from parents to offspring, Mendel\'s laws of inheritance, and the process of evolution through natural selection.'
            },
            'natural-resources': {
                id: 'natural-resources',
                name: 'Management of Natural Resources',
                description: 'Conservation and sustainable use of natural resources',
                summary: 'Learn about the importance of conserving forests, wildlife, water, coal, and petroleum for sustainable development and environmental protection.'
            }
        }
    },
    'social-science': {
        name: 'Social Science',
        chapters: {
            'nationalism': {
                id: 'nationalism',
                name: 'The Rise of Nationalism in Europe',
                description: 'European nationalism in the 19th century',
                summary: 'Explore the growth of nationalist sentiments in Europe, the unification of Germany and Italy, and the impact of nationalism on European politics.'
            },
            'forest-society': {
                id: 'forest-society',
                name: 'Forest and Wildlife Resources',
                description: 'Conservation of forests and wildlife in India',
                summary: 'Understand the importance of forests and wildlife, threats to biodiversity, and conservation efforts in India including national parks and sanctuaries.'
            },
            'water-resources': {
                id: 'water-resources',
                name: 'Water Resources',
                description: 'Water scarcity and conservation methods',
                summary: 'Learn about water as a renewable resource, causes of water scarcity, and various methods of water conservation and management.'
            },
            'agriculture': {
                id: 'agriculture',
                name: 'Agriculture',
                description: 'Types of farming and agricultural practices in India',
                summary: 'Study different types of farming, cropping patterns, and the impact of globalization on Indian agriculture and farmers.'
            },
            'democracy': {
                id: 'democracy',
                name: 'Democratic Politics',
                description: 'Power sharing and federalism in democracy',
                summary: 'Understand the concept of power sharing, federalism in India, and the working of democratic institutions at various levels.'
            }
        }
    }
};

// Question Database with proper options
const questionDatabase = {
    science: {
        light: {
            foundation: [
                {
                    question: "What happens when light falls on a smooth surface?",
                    options: ["It gets absorbed", "It gets reflected", "It gets refracted", "It disappears"],
                    correctAnswer: 1
                },
                {
                    question: "Which type of mirror is used in car headlights?",
                    options: ["Plane mirror", "Concave mirror", "Convex mirror", "Cylindrical mirror"],
                    correctAnswer: 1
                },
                {
                    question: "What is the angle of incidence when a ray falls normally on a mirror?",
                    options: ["0°", "30°", "45°", "90°"],
                    correctAnswer: 0
                },
                {
                    question: "Which lens is thicker at the center than at the edges?",
                    options: ["Concave lens", "Convex lens", "Cylindrical lens", "Plane lens"],
                    correctAnswer: 1
                },
                {
                    question: "What type of image is formed by a plane mirror?",
                    options: ["Real and inverted", "Virtual and erect", "Real and erect", "Virtual and inverted"],
                    correctAnswer: 1
                }
            ],
            core: [
                {
                    question: "If the angle of incidence is 30°, what is the angle of reflection?",
                    options: ["15°", "30°", "60°", "90°"],
                    correctAnswer: 1
                },
                {
                    question: "Which mirror always forms a virtual, erect and diminished image?",
                    options: ["Plane mirror", "Concave mirror", "Convex mirror", "None of these"],
                    correctAnswer: 2
                },
                {
                    question: "What is the focal length of a plane mirror?",
                    options: ["Zero", "Infinity", "25 cm", "50 cm"],
                    correctAnswer: 1
                },
                {
                    question: "When light travels from air to water, it bends:",
                    options: ["Away from normal", "Towards normal", "Does not bend", "Bends at 90°"],
                    correctAnswer: 1
                },
                {
                    question: "The refractive index of water is 1.33. What does this mean?",
                    options: ["Light travels 1.33 times faster in water", "Light travels 1.33 times slower in water", "Water is 1.33 times denser", "None of these"],
                    correctAnswer: 1
                }
            ],
            advanced: [
                {
                    question: "A concave mirror has a focal length of 20 cm. If an object is placed 30 cm from the mirror, where will the image be formed?",
                    options: ["40 cm", "50 cm", "60 cm", "70 cm"],
                    correctAnswer: 2
                },
                {
                    question: "What is the critical angle for total internal reflection when light travels from glass (n=1.5) to air?",
                    options: ["30°", "42°", "48°", "60°"],
                    correctAnswer: 1
                },
                {
                    question: "A convex lens has a focal length of 15 cm. What is its power?",
                    options: ["6.67 D", "15 D", "0.067 D", "1.5 D"],
                    correctAnswer: 0
                },
                {
                    question: "Which phenomenon is responsible for the twinkling of stars?",
                    options: ["Reflection", "Refraction", "Dispersion", "Scattering"],
                    correctAnswer: 1
                },
                {
                    question: "The least distance of distinct vision for a normal human eye is:",
                    options: ["15 cm", "20 cm", "25 cm", "30 cm"],
                    correctAnswer: 2
                }
            ],
            expert: [
                {
                    question: "A ray of light incident at 60° on one face of an equilateral prism emerges at 40° from the other face. What is the angle of deviation?",
                    options: ["20°", "30°", "40°", "50°"],
                    correctAnswer: 1
                },
                {
                    question: "For a concave mirror, if the object distance is equal to the radius of curvature, the image formed is:",
                    options: ["At infinity", "At the center of curvature", "At the focus", "Between focus and center"],
                    correctAnswer: 1
                },
                {
                    question: "The magnification produced by a convex mirror is always:",
                    options: ["Greater than 1", "Less than 1", "Equal to 1", "Negative"],
                    correctAnswer: 1
                },
                {
                    question: "Which defect of vision is corrected using a cylindrical lens?",
                    options: ["Myopia", "Hypermetropia", "Astigmatism", "Presbyopia"],
                    correctAnswer: 2
                },
                {
                    question: "The phenomenon of dispersion of white light is due to:",
                    options: ["Different wavelengths have different refractive indices", "Reflection", "Absorption", "Scattering"],
                    correctAnswer: 0
                }
            ],
            master: [
                {
                    question: "A compound microscope has an objective lens of focal length 2 cm and eyepiece of focal length 5 cm. If the distance between lenses is 22 cm, what is the magnifying power for relaxed eye?",
                    options: ["50", "75", "100", "125"],
                    correctAnswer: 1
                },
                {
                    question: "In a Newton's ring experiment, the diameter of the 10th dark ring is 0.5 cm. What is the diameter of the 20th dark ring?",
                    options: ["0.707 cm", "1.0 cm", "1.414 cm", "2.0 cm"],
                    correctAnswer: 0
                },
                {
                    question: "A glass prism has a refracting angle of 60° and refractive index 1.5. What is the angle of minimum deviation?",
                    options: ["30°", "37°", "42°", "48°"],
                    correctAnswer: 1
                },
                {
                    question: "The resolving power of a telescope depends on:",
                    options: ["Focal length of objective", "Diameter of objective", "Focal length of eyepiece", "Magnifying power"],
                    correctAnswer: 1
                },
                {
                    question: "In fiber optic communication, which principle is used?",
                    options: ["Reflection", "Refraction", "Total internal reflection", "Dispersion"],
                    correctAnswer: 2
                }
            ]
        }
        // Add more chapters with similar structure
    }
    // Add social-science questions similarly
};

// Get subjects
router.get('/subjects', (req, res) => {
    res.json({
        success: true,
        subjects: subjectsData
    });
});

// Get chapters for a subject
router.get('/subjects/:subject/chapters', (req, res) => {
    const { subject } = req.params;
    
    if (!subjectsData[subject]) {
        return res.status(404).json({
            success: false,
            error: 'Subject not found'
        });
    }

    res.json({
        success: true,
        subject: subjectsData[subject]
    });
});

// Get questions for a chapter and difficulty level
router.get('/questions/:subject/:chapter/:level', (req, res) => {
    const { subject, chapter, level } = req.params;
    
    const questions = questionDatabase[subject]?.[chapter]?.[level];
    
    if (!questions) {
        return res.status(404).json({
            success: false,
            error: 'Questions not found for this combination'
        });
    }

    // Shuffle questions and return 5 random ones
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(5, shuffled.length));

    res.json({
        success: true,
        questions: selectedQuestions
    });
});

module.exports = router;