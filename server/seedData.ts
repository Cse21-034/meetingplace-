/**
 * Seed Data for Kgotla Discussion Forum
 * 
 * Provides sample posts, comments, and users for development and demonstration.
 * Creates authentic African community discussions and content.
 */

import { storage } from "./storage";

export async function seedDatabase() {
  console.log("Seeding database with sample data...");

  try {
    // Sample users (these would normally be created through authentication)
    const sampleUsers = [
      {
        id: "user_1",
        email: "nomsa@example.com",
        firstName: "Nomsa",
        lastName: "Mthembu",
        profileImageUrl: "",
      },
      {
        id: "user_2", 
        email: "thabo@example.com",
        firstName: "Thabo",
        lastName: "Modise",
        profileImageUrl: "",
      },
      {
        id: "user_3",
        email: "fatima@example.com", 
        firstName: "Fatima",
        lastName: "Hassan",
        profileImageUrl: "",
      }
    ];

    // Create sample users
    for (const userData of sampleUsers) {
      await storage.upsertUser(userData);
    }

    // Sample posts with authentic African content
    const samplePosts = [
      {
        authorId: "user_1",
        type: "text",
        title: "Traditional Healing Wisdom",
        content: "My grandmother always said that the African potato (Hypoxis hemerocallidea) is one of nature's most powerful healers. She used it to boost immunity and treat various ailments. What traditional remedies do your elders still use today? Let's preserve this knowledge for future generations. 🌿 #TraditionalMedicine #AfricanWisdom",
        tags: ["traditional-medicine", "wellness", "culture"],
        isAnonymous: false,
      },
      {
        authorId: "user_2",
        type: "question",
        title: "Starting a Small Business in Township",
        content: "I'm planning to start a small tuck shop in my township but I'm not sure about the regulations and licenses needed. Has anyone here successfully started a business in a township setting? What challenges did you face and how did you overcome them? Any advice would be appreciated! 💼",
        tags: ["business", "entrepreneurship", "township"],
        isAnonymous: false,
      },
      {
        authorId: "user_3",
        type: "text",
        title: "Ubuntu Philosophy in Modern Times", 
        content: "I've been thinking about how Ubuntu - 'I am because we are' - can guide us in today's digital world. How do we maintain our sense of community and interconnectedness when so much of our interaction happens online? What does Ubuntu mean to you in 2025?",
        tags: ["ubuntu", "philosophy", "community"],
        isAnonymous: false,
      },
      {
        authorId: "user_1",
        type: "text",
        title: "Weather Patterns and Farming",
        content: "The rain patterns have been quite unpredictable this season. My maize crop is struggling, and I'm considering drought-resistant varieties. Fellow farmers, what crops are you growing that can handle these changing weather conditions? Any success stories with indigenous crops? 🌽☔",
        tags: ["farming", "weather", "agriculture"],
        isAnonymous: false,
      },
      {
        authorId: "user_2",
        type: "question",
        title: "Teaching Children Native Languages",
        content: "My children are losing their connection to Sesotho because they speak English at school all day. How are other parents preserving our languages at home? What methods work best for keeping our cultural languages alive in the next generation? 🗣️",
        tags: ["language", "culture", "parenting"],
        isAnonymous: false,
      },
      {
        authorId: "user_3",
        type: "text",
        title: "Community Garden Success Story",
        content: "Our community garden project has been running for 6 months now! We've grown enough vegetables to feed 20 families and even have surplus to sell at the local market. The key was getting everyone involved and sharing traditional knowledge about soil preparation. Who else is part of a community garden? 🌱",
        tags: ["community", "gardening", "sustainability"],
        isAnonymous: false,
      },
      {
        authorId: "user_1",
        type: "text",
        title: "Youth and Technology Skills",
        content: "There's such a gap between the youth who have access to technology training and those who don't. In my area, we started a weekend coding club using donated laptops. It's amazing to see young people building websites and apps! What digital skills programs exist in your community? 💻",
        tags: ["youth", "technology", "education"],
        isAnonymous: false,
      },
      {
        authorId: "user_2",
        type: "question",
        title: "Traditional Wedding Customs",
        content: "I'm getting married next year and want to incorporate both modern and traditional elements. What are some meaningful traditional wedding customs from your culture that you'd recommend? Looking for authentic practices that honor our ancestors while celebrating our future together. 💍",
        tags: ["wedding", "tradition", "culture"],
        isAnonymous: false,
      }
    ];

    // Create sample posts
    const createdPosts = [];
    for (const postData of samplePosts) {
      const post = await storage.createPost(postData);
      createdPosts.push(post);
    }

    // Create sample comments
    const sampleComments = [
      {
        postId: createdPosts[0].id,
        authorId: "user_2",
        content: "My mother also uses African potato! She combines it with sutherlandia (cancer bush) to make a powerful immune booster. These plants have sustained our people for generations.",
      },
      {
        postId: createdPosts[0].id,
        authorId: "user_3",
        content: "We should document these recipes properly. I'm working with elders in my community to create a database of traditional medicine knowledge. Would love to collaborate!",
      },
      {
        postId: createdPosts[1].id,
        authorId: "user_1",
        content: "I started my spaza shop 3 years ago. The main thing is getting your trading license from the municipality and understanding the health regulations if you're selling food. Happy to share my experience!",
      },
      {
        postId: createdPosts[1].id,
        authorId: "user_3",
        content: "Also consider joining a local business association or stokvela. The support network really helps, especially with bulk buying and sharing suppliers.",
      },
      {
        postId: createdPosts[2].id,
        authorId: "user_1",
        content: "Ubuntu guides everything I do online. Before posting anything, I ask myself: does this contribute to our collective wellbeing? Does it build or divide our community?",
      },
      {
        postId: createdPosts[4].id,
        authorId: "user_3",
        content: "We use songs and storytelling! Children love hearing stories in their mother tongue. Also, we have 'indigenous language Sundays' where we only speak Sesotho at home.",
      }
    ];

    // Create sample comments
    for (const commentData of sampleComments) {
      await storage.createComment(commentData);
    }

    // Create some sample votes  
    try {
      await storage.createVote({ userId: "user_2", postId: createdPosts[0].id, type: "upvote" });
      await storage.createVote({ userId: "user_3", postId: createdPosts[0].id, type: "upvote" });
      await storage.createVote({ userId: "user_1", postId: createdPosts[1].id, type: "upvote" });
      await storage.createVote({ userId: "user_3", postId: createdPosts[2].id, type: "upvote" });
    } catch (voteError) {
      console.log("Note: Vote creation skipped - votes may already exist or schema mismatch");
    }

    console.log("Database seeded successfully!");
    console.log(`Created ${sampleUsers.length} users, ${createdPosts.length} posts, and ${sampleComments.length} comments`);

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}