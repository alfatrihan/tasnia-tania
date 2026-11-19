/* "How well do you know her?" quiz, shown as photo-style cards.
   Pick an answer, press Submit: the card flips away and the next one comes up. Marks are counted silently
   and the result comes after the last question. BANK holds the real questions; a = index of the correct option (0-3). 10 random questions are asked each game. */
(() => {
    const box = document.getElementById('quiz-box');
    if (!box) return;

    // ---------- question bank: 74 questions (from tania_quiz_100_bangla.docx, answers from the form responses) ----------
    // q / o hold the English and Bangla text of each question and option. a = index of the correct option (0-3).
    const BANK = [
        { q: { en: 'Which side of Tania\'s eyebrow has the special mark?', bn: 'তানিয়ার ভ্রুতে থাকা বিশেষ দাগটি কোন পাশে?' }, o: [{ en: 'Right side', bn: 'ডান পাশে' }, { en: 'Left side', bn: 'বাম পাশে' }, { en: 'Both sides', bn: 'দুই পাশেই' }, { en: 'There is no mark on the eyebrow', bn: 'ভ্রুতে কোনো দাগ নেই' }], a: 0 },
        { q: { en: 'Which feature of Tania\'s face helps people recognise her at once?', bn: 'তানিয়ার মুখের কোন বৈশিষ্ট্যটি তাকে দেখলেই আলাদা করে চিনতে সাহায্য করে?' }, o: [{ en: 'A cut mark on the eyebrow', bn: 'ভ্রুর কাটা দাগ' }, { en: 'A mole on the cheek', bn: 'গালের তিল' }, { en: 'A mole at the corner of the lips', bn: 'ঠোঁটের কোণে তিল' }, { en: 'A mark under the eye', bn: 'চোখের নিচের দাগ' }], a: 0 },
        { q: { en: 'If you had to describe Tania in one word, which would suit her best?', bn: 'তানিয়াকে এক কথায় বর্ণনা করতে হলে কোনটি সবচেয়ে মানাবে?' }, o: [{ en: 'Stubborn but good-hearted', bn: 'জেদি কিন্তু ভালো মনের' }, { en: 'Calm but mysterious', bn: 'শান্ত কিন্তু রহস্যময়' }, { en: 'Cheerful but shy', bn: 'হাসিখুশি কিন্তু লাজুক' }, { en: 'The same in every situation', bn: 'সব পরিস্থিতিতে একই রকম' }], a: 0 },
        { q: { en: 'When Tania sets her mind on something, what is she most likely to do?', bn: 'তানিয়া কোনো বিষয়ে একবার জেদ ধরলে কী হওয়ার সম্ভাবনা বেশি?' }, o: [{ en: 'Change her mind easily', bn: 'সহজে মত বদলাবে' }, { en: 'Stay firm on her own view', bn: 'নিজের কথায় অটল থাকবে' }, { en: 'Persuade everyone to agree', bn: 'সবাইকে বুঝিয়ে রাজি করাবে' }, { en: 'Accept someone else\'s decision', bn: 'অন্যের সিদ্ধান্ত মেনে নেবে' }], a: 1 },
        { q: { en: 'When Tania is sad, which behaviour is noticed first?', bn: 'তানিয়ার মন খারাপ হলে কোন আচরণটি আগে চোখে পড়ে?' }, o: [{ en: 'She goes quiet', bn: 'চুপচাপ হয়ে যায়' }, { en: 'She talks even more', bn: 'আরও বেশি কথা বলে' }, { en: 'She keeps smiling', bn: 'সব সময় হাসে' }, { en: 'She falls asleep at once', bn: 'সঙ্গে সঙ্গে ঘুমিয়ে পড়ে' }], a: 0 },
        { q: { en: 'What is most important to know in order to really know Tania?', bn: 'তানিয়াকে সত্যি চেনার জন্য কোন বিষয়টি জানা সবচেয়ে জরুরি?' }, o: [{ en: 'Her likes and dislikes', bn: 'তার পছন্দ-অপছন্দ' }, { en: 'Her anger and sulking', bn: 'তার রাগ-অভিমান' }, { en: 'Her old memories', bn: 'তার পুরোনো স্মৃতি' }, { en: 'All of these', bn: 'সব কটিই' }], a: 3 },
        { q: { en: 'What is Tania\'s favourite food?', bn: 'তানিয়ার সবচেয়ে প্রিয় খাবার কোনটি?' }, o: [{ en: 'Biryani', bn: 'বিরিয়ানি' }, { en: 'Fuchka', bn: 'ফুচকা' }, { en: 'Chotpoti', bn: 'চটপটি' }, { en: 'Something else', bn: 'অন্য কিছু' }], a: 0 },
        { q: { en: 'If you want to cheer Tania up suddenly, which food should you bring?', bn: 'তানিয়াকে হঠাৎ খুশি করতে চাইলে কোন খাবারটি নিয়ে যাওয়া উচিত?' }, o: [{ en: 'Her favourite food', bn: 'তার সবচেয়ে প্রিয় খাবার' }, { en: 'Any spicy food', bn: 'যেকোনো ঝাল খাবার' }, { en: 'Only sweets', bn: 'শুধু মিষ্টি' }, { en: 'Only fruit', bn: 'শুধু ফল' }], a: 1 },
        { q: { en: 'Which taste does Tania prefer: spicy, sweet, or sour?', bn: 'তানিয়া ঝাল, মিষ্টি, নাকি টক—কোন স্বাদ বেশি পছন্দ করে?' }, o: [{ en: 'Spicy', bn: 'ঝাল' }, { en: 'Sweet', bn: 'মিষ্টি' }, { en: 'Sour', bn: 'টক' }, { en: 'All three equally', bn: 'তিনটিই সমান' }], a: 0 },
        { q: { en: 'What is Tania\'s favourite drink?', bn: 'তানিয়ার পছন্দের পানীয় কোনটি?' }, o: [{ en: 'Tea', bn: 'চা' }, { en: 'Coffee', bn: 'কফি' }, { en: 'Juice', bn: 'জুস' }, { en: 'Lemon sherbet', bn: 'লেবুর শরবত' }], a: 1 },
        { q: { en: 'If Tania wants ice cream, which flavour will she choose?', bn: 'তানিয়া আইসক্রিম খেতে চাইলে কোন স্বাদটি বেছে নেবে?' }, o: [{ en: 'Chocolate', bn: 'চকলেট' }, { en: 'Vanilla', bn: 'ভ্যানিলা' }, { en: 'Strawberry', bn: 'স্ট্রবেরি' }, { en: 'Mango', bn: 'আম' }], a: 0 },
        { q: { en: 'If her favourite food and her favourite person are both in front of her, what will she choose?', bn: 'তানিয়ার সামনে পছন্দের খাবার আর পছন্দের মানুষ—দুটো একসঙ্গে এলে সে কী বেছে নেবে?' }, o: [{ en: 'The food', bn: 'খাবার' }, { en: 'The person', bn: 'মানুষ' }, { en: 'Both', bn: 'দুটোই' }, { en: 'It depends on the situation', bn: 'পরিস্থিতি বুঝে' }], a: 1 },
        { q: { en: 'Which food does Tania not like at all?', bn: 'তানিয়া কোন খাবারটি একেবারেই পছন্দ করে না?' }, o: [{ en: 'Too spicy', bn: 'অতিরিক্ত ঝাল' }, { en: 'Too sweet', bn: 'অতিরিক্ত মিষ্টি' }, { en: 'Bitter food', bn: 'তিক্ত খাবার' }, { en: 'Something else', bn: 'অন্য কিছু' }], a: 1 },
        { q: { en: 'If you go out to eat with Tania, which place is a good choice?', bn: 'তানিয়াকে নিয়ে বাইরে খেতে গেলে কোন জায়গাটি বেছে নেওয়া ভালো?' }, o: [{ en: 'A fuchka stall', bn: 'ফুচকার দোকান' }, { en: 'A biryani shop', bn: 'বিরিয়ানির দোকান' }, { en: 'A cafe', bn: 'ক্যাফে' }, { en: 'A place she likes', bn: 'তার পছন্দের জায়গা' }], a: 2 },
        { q: { en: 'How does Tania share food?', bn: 'তানিয়া খাবার ভাগ করে খেতে কেমন?' }, o: [{ en: 'She shares on her own', bn: 'নিজে থেকেই ভাগ দেয়' }, { en: 'She shares only when asked', bn: 'বললে ভাগ দেয়' }, { en: 'She eats her own food', bn: 'নিজেরটা নিজে খায়' }, { en: 'It depends on the food', bn: 'খাবারের ওপর নির্ভর করে' }], a: 0 },
        { q: { en: 'What is Tania\'s favourite colour?', bn: 'তানিয়ার প্রিয় রং কোনটি?' }, o: [{ en: 'Black', bn: 'কালো' }, { en: 'Blue', bn: 'নীল' }, { en: 'Pink', bn: 'গোলাপি' }, { en: 'Some other colour', bn: 'অন্য রং' }], a: 0 },
        { q: { en: 'In which kind of clothes does Tania feel most beautiful?', bn: 'তানিয়া কোন ধরনের পোশাকে নিজেকে বেশি সুন্দর মনে করে?' }, o: [{ en: 'Saree', bn: 'শাড়ি' }, { en: 'Three-piece', bn: 'থ্রি-পিস' }, { en: 'Western clothes', bn: 'পশ্চিমা পোশাক' }, { en: 'Whatever she feels comfortable in', bn: 'যেটাতে স্বাচ্ছন্দ্য লাগে' }], a: 3 },
        { q: { en: 'What is Tania\'s favourite flower?', bn: 'তানিয়ার প্রিয় ফুল কোনটি?' }, o: [{ en: 'Rose', bn: 'গোলাপ' }, { en: 'Jasmine', bn: 'জুঁই' }, { en: 'Sunflower', bn: 'সূর্যমুখী' }, { en: 'Bela (Arabian jasmine)', bn: 'বেলি' }], a: 0 },
        { q: { en: 'In which season is Tania happiest?', bn: 'তানিয়া কোন ঋতুতে সবচেয়ে বেশি আনন্দ পায়?' }, o: [{ en: 'Winter', bn: 'শীত' }, { en: 'Monsoon', bn: 'বর্ষা' }, { en: 'Spring', bn: 'বসন্ত' }, { en: 'Summer', bn: 'গ্রীষ্ম' }], a: 0 },
        { q: { en: 'If Tania goes travelling, which place might she choose?', bn: 'তানিয়া ঘুরতে গেলে কোন জায়গাটি বেছে নিতে পারে?' }, o: [{ en: 'The sea', bn: 'সমুদ্র' }, { en: 'The hills', bn: 'পাহাড়' }, { en: 'A quiet natural place', bn: 'প্রকৃতির নিরিবিলি জায়গা' }, { en: 'A place her friends like', bn: 'বন্ধুদের পছন্দের জায়গা' }], a: 2 },
        { q: { en: 'What is Tania\'s favourite time of day?', bn: 'তানিয়ার সবচেয়ে পছন্দের সময় কোনটি?' }, o: [{ en: 'Morning', bn: 'সকাল' }, { en: 'Noon', bn: 'দুপুর' }, { en: 'Afternoon', bn: 'বিকেল' }, { en: 'Night', bn: 'রাত' }], a: 3 },
        { q: { en: 'When Tania has free time, what does she like to do first?', bn: 'তানিয়া অবসর পেলে প্রথমে কী করতে ভালোবাসে?' }, o: [{ en: 'Sleep', bn: 'ঘুমাতে' }, { en: 'Listen to music', bn: 'গান শুনতে' }, { en: 'Scroll through her phone', bn: 'ফোন ঘাঁটতে' }, { en: 'Talk with friends', bn: 'বন্ধুদের সঙ্গে কথা বলতে' }], a: 2 },
        { q: { en: 'What kind of songs does Tania listen to most?', bn: 'তানিয়া কোন ধরনের গান বেশি শোনে?' }, o: [{ en: 'Romantic', bn: 'রোমান্টিক' }, { en: 'Sad songs', bn: 'মন খারাপের গান' }, { en: 'Upbeat songs', bn: 'উচ্ছল গান' }, { en: 'All kinds', bn: 'সব ধরনের' }], a: 3 },
        { q: { en: 'What could be the most beautiful gift for Tania?', bn: 'তানিয়ার কাছে সবচেয়ে সুন্দর উপহার কোনটি হতে পারে?' }, o: [{ en: 'Flowers', bn: 'ফুল' }, { en: 'Chocolate', bn: 'চকলেট' }, { en: 'A letter written by hand', bn: 'নিজের হাতে লেখা চিঠি' }, { en: 'Time spent together', bn: 'একসঙ্গে কাটানো সুন্দর সময়' }], a: 3 },
        { q: { en: 'If you take Tania out somewhere, what will she do most?', bn: 'তানিয়াকে কোথাও বেড়াতে নিয়ে গেলে সে কোন কাজটি বেশি করবে?' }, o: [{ en: 'Take photos', bn: 'ছবি তুলবে' }, { en: 'Look for food', bn: 'খাবার খুঁজবে' }, { en: 'Chat', bn: 'গল্প করবে' }, { en: 'All of these', bn: 'সবই করবে' }], a: 3 },
        { q: { en: 'Which part of her childhood does Tania herself not fully remember?', bn: 'তানিয়ার ছোটবেলার কোন বিষয়টি তার নিজেরও ভালোভাবে মনে নেই?' }, o: [{ en: 'The early school years', bn: 'স্কুলে যাওয়ার শুরুর দিকের বছরগুলো' }, { en: 'Names of friends', bn: 'বন্ধুদের নাম' }, { en: 'Her first exam result', bn: 'প্রথম পরীক্ষার ফল' }, { en: 'Her first place of travel', bn: 'প্রথম বেড়ানোর জায়গা' }], a: 3 },
        { q: { en: 'Until when did Tania\'s good time last in 2018?', bn: '২০১৮ সালে কোন সময় পর্যন্ত তানিয়ার ভালো কেটেছিল?' }, o: [{ en: 'Until the results were out', bn: 'ফলাফল দেখার আগ পর্যন্ত' }, { en: 'Until the exams', bn: 'পরীক্ষার আগ পর্যন্ত' }, { en: 'Until the end of the year', bn: 'বছরের শেষ পর্যন্ত' }, { en: 'After she joined college', bn: 'কলেজে ওঠার পর' }], a: 0 },
        { q: { en: 'Which event of 2018 is especially remembered by Tania?', bn: '২০১৮ সালের কোন ঘটনাটি তানিয়ার স্মৃতিতে বিশেষভাবে আছে?' }, o: [{ en: 'Seeing the results', bn: 'ফলাফল দেখা' }, { en: 'Changing school', bn: 'স্কুল বদল' }, { en: 'A new friendship', bn: 'নতুন বন্ধুত্ব' }, { en: 'The first trip', bn: 'প্রথম ভ্রমণ' }], a: 0 },
        { q: { en: 'What was Tania\'s college life like?', bn: 'তানিয়ার কলেজজীবন কেমন ছিল?' }, o: [{ en: 'Very joyful', bn: 'খুব আনন্দের' }, { en: 'Full of friends and outings', bn: 'বন্ধু আর ঘোরাঘুরিতে ভরা' }, { en: 'Some good, some bad', bn: 'কিছু ভালো কিছু খারাপ' }, { en: 'Not enjoyable at all', bn: 'একেবারেই ভালো লাগেনি' }], a: 1 },
        { q: { en: 'Which college memory does Tania remember the most?', bn: 'কলেজজীবনের কোন স্মৃতিটি তানিয়া সবচেয়ে বেশি মনে করতে পারে?' }, o: [{ en: 'Adda with friends', bn: 'বন্ধুদের সঙ্গে আড্ডা' }, { en: 'Fun in class', bn: 'ক্লাসের মজা' }, { en: 'Studying the night before exams', bn: 'পরীক্ষার আগের রাতের পড়াশোনা' }, { en: 'Some especially special event', bn: 'সবচেয়ে বিশেষ কোনো ঘটনা' }], a: 0 },
        { q: { en: 'What kind of student was Tania at school?', bn: 'তানিয়া স্কুলে কেমন ছাত্রী ছিল?' }, o: [{ en: 'Quiet', bn: 'শান্ত' }, { en: 'Naughty', bn: 'দুষ্টু' }, { en: 'Attentive', bn: 'মনোযোগী' }, { en: 'All of these', bn: 'সব রকমই' }], a: 3 },
        { q: { en: 'What could have been the most fun time in Tania\'s school life?', bn: 'তানিয়ার স্কুলজীবনের সবচেয়ে মজার সময় কোনটি হতে পারে?' }, o: [{ en: 'Lunch break', bn: 'টিফিনের সময়' }, { en: 'Classes with friends', bn: 'বন্ধুদের সঙ্গে ক্লাস' }, { en: 'The bell at the end of the day', bn: 'ছুটির ঘণ্টা' }, { en: 'School functions', bn: 'স্কুলের অনুষ্ঠান' }], a: 0 },
        { q: { en: 'What did Tania enjoy most at college?', bn: 'তানিয়া কলেজে কোন বিষয়টি বেশি উপভোগ করত?' }, o: [{ en: 'Time with friends', bn: 'বন্ধুদের সঙ্গে সময়' }, { en: 'Adda between classes', bn: 'ক্লাসের ফাঁকে আড্ডা' }, { en: 'Outings', bn: 'ঘোরাঘুরি' }, { en: 'All of these', bn: 'সবগুলো' }], a: 0 },
        { q: { en: 'In which year did Tania become friends with Sadia?', bn: 'তানিয়ার সাদিয়ার সঙ্গে বন্ধুত্ব হয় কোন সালে?' }, o: [{ en: '2015', bn: '২০১৫' }, { en: '2018', bn: '২০১৮' }, { en: '2019', bn: '২০১৯' }, { en: '2022', bn: '২০২২' }], a: 2 },
        { q: { en: 'Who did Tania spend a lot of time with in 2022/23?', bn: '২০২২/২৩ সালে তানিয়া কার সঙ্গে প্রচুর ঘুরেছে?' }, o: [{ en: 'Lithi and Shupti', bn: 'লিথি ও শুপ্তি' }, { en: 'Toa and Sadia', bn: 'তোয়া ও সাদিয়া' }, { en: 'Taiba and Toa', bn: 'তাইবা ও তোয়া' }, { en: 'Sadia and Taiba', bn: 'সাদিয়া ও তাইবা' }], a: 0 },
        { q: { en: 'Which period\'s memories include outings in particular?', bn: 'তানিয়ার কোন সময়ের স্মৃতিতে ঘোরাঘুরির কথা বিশেষভাবে আছে?' }, o: [{ en: '2015', bn: '২০১৫' }, { en: '2018', bn: '২০১৮' }, { en: '2022/23', bn: '২০২২/২৩' }, { en: '2019', bn: '২০১৯' }], a: 2 },
        { q: { en: 'Which theme keeps coming back in Tania\'s friendship stories?', bn: 'তানিয়ার বন্ধুত্বের গল্পে কোন বিষয়টি বারবার ফিরে আসে?' }, o: [{ en: 'New people and new memories', bn: 'নতুন মানুষ ও নতুন স্মৃতি' }, { en: 'Only studies', bn: 'শুধু পড়াশোনা' }, { en: 'Only gifts', bn: 'শুধু উপহার' }, { en: 'Only competition', bn: 'শুধু প্রতিযোগিতা' }], a: 0 },
        { q: { en: 'What is the biggest joy of going out with Tania\'s friends?', bn: 'তানিয়ার বন্ধুদের সঙ্গে ঘুরতে যাওয়ার সবচেয়ে বড় আনন্দ কী?' }, o: [{ en: 'Spending time together', bn: 'একসঙ্গে সময় কাটানো' }, { en: 'Taking photos', bn: 'ছবি তোলা' }, { en: 'Eating together', bn: 'একসঙ্গে খাওয়া-দাওয়া' }, { en: 'All of these', bn: 'সবগুলো' }], a: 0 },
        { q: { en: 'Which quality is most needed to keep Tania\'s friendship going?', bn: 'তানিয়ার বন্ধুত্ব টিকিয়ে রাখতে কোন গুণটি সবচেয়ে দরকার?' }, o: [{ en: 'Trust', bn: 'বিশ্বাস' }, { en: 'Respect', bn: 'সম্মান' }, { en: 'Being there', bn: 'পাশে থাকা' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'If someone keeps teasing Tania again and again, what can she do?', bn: 'কেউ তানিয়াকে বারবার খেপালে সে কী করতে পারে?' }, o: [{ en: 'Tease back', bn: 'পাল্টা খেপাবে' }, { en: 'Get angry', bn: 'রেগে যাবে' }, { en: 'Walk away directly', bn: 'সোজা চলে যাবে' }, { en: 'Respond depending on the situation', bn: 'পরিস্থিতি বুঝে প্রতিক্রিয়া দেবে' }], a: 1 },
        { q: { en: 'If Tania has made a plan, what might happen at the last moment?', bn: 'তানিয়া কোনো পরিকল্পনা করে ফেললে শেষ মুহূর্তে কী হতে পারে?' }, o: [{ en: 'She changes the plan', bn: 'পরিকল্পনা বদলে ফেলবে' }, { en: 'She goes no matter what', bn: 'যেভাবেই হোক যাবে' }, { en: 'She asks others for their opinion', bn: 'অন্যদের মত নেবে' }, { en: 'She decides depending on the situation', bn: 'পরিস্থিতি অনুযায়ী সিদ্ধান্ত নেবে' }], a: 3 },
        { q: { en: 'What might be behind Tania\'s smile?', bn: 'তানিয়ার হাসির পেছনে কোন ব্যাপারটি থাকতে পারে?' }, o: [{ en: 'Something funny', bn: 'কোনো মজার কথা' }, { en: 'A friend\'s mischief', bn: 'বন্ধুর দুষ্টুমি' }, { en: 'Her own prank', bn: 'নিজের কোনো কাণ্ড' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'When Tania feels very close to someone, how does she show it?', bn: 'তানিয়া কাউকে খুব আপন ভাবলে কীভাবে তা প্রকাশ করে?' }, o: [{ en: 'By checking on them', bn: 'খোঁজখবর নিয়ে' }, { en: 'By giving time', bn: 'সময় দিয়ে' }, { en: 'By caring for them', bn: 'যত্ন করে' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'What does Tania do when she does not like something someone says?', bn: 'তানিয়া কোনো কথা পছন্দ না করলে কী করে?' }, o: [{ en: 'Says it directly', bn: 'সরাসরি বলে' }, { en: 'Looks upset', bn: 'মুখ ভার করে' }, { en: 'Stays silent', bn: 'চুপ থাকে' }, { en: 'Depends on the situation', bn: 'পরিস্থিতি অনুযায়ী' }], a: 3 },
        { q: { en: 'Which behaviour annoys Tania the most?', bn: 'তানিয়ার কাছে কোন আচরণটি সবচেয়ে বিরক্তিকর?' }, o: [{ en: 'Lying', bn: 'মিথ্যা বলা' }, { en: 'Neglect', bn: 'অবহেলা করা' }, { en: 'Not keeping a promise', bn: 'কথা দিয়ে কথা না রাখা' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'If Tania says "nothing happened", what might really be the case?', bn: 'তানিয়া যদি বলে “কিছু হয়নি”, তখন আসলে কী হতে পারে?' }, o: [{ en: 'Nothing really happened', bn: 'সত্যিই কিছু হয়নি' }, { en: 'Something happened but she does not want to say', bn: 'কিছু একটা হয়েছে কিন্তু বলতে চাইছে না' }, { en: 'She is angry', bn: 'সে রাগ করেছে' }, { en: 'She is just joking', bn: 'সে শুধু মজা করছে' }], a: 1 },
        { q: { en: 'If Tania suddenly goes quiet, what should someone close to her do?', bn: 'তানিয়া হঠাৎ চুপ হয়ে গেলে কাছের মানুষের কী করা উচিত?' }, o: [{ en: 'Force her to talk', bn: 'জোর করে কথা বলানো' }, { en: 'Stay by her side', bn: 'তার পাশে থাকা' }, { en: 'Leave her alone', bn: 'তাকে একা ফেলে চলে যাওয়া' }, { en: 'Laugh about it', bn: 'বিষয়টি নিয়ে হাসাহাসি করা' }], a: 1 },
        { q: { en: 'Which thing does Tania find hard to forget?', bn: 'তানিয়া কোন বিষয়টি সহজে ভুলতে পারে না?' }, o: [{ en: 'A kindness someone did', bn: 'কেউ করা ভালো কাজ' }, { en: 'A hurt someone caused', bn: 'কেউ দেওয়া কষ্ট' }, { en: 'The name of a childhood playmate', bn: 'ছোটবেলার খেলার সাথীর নাম' }, { en: 'All of these', bn: 'সবগুলো' }], a: 1 },
        { q: { en: 'If Tania is suddenly frightened, what might be her first reaction?', bn: 'হঠাৎ ভয় পেলে তানিয়ার প্রথম প্রতিক্রিয়া কী হতে পারে?' }, o: [{ en: 'She screams', bn: 'চিৎকার করে' }, { en: 'She moves away', bn: 'সরে যায়' }, { en: 'She laughs it off', bn: 'হেসে উড়িয়ে দেয়' }, { en: 'She calls someone', bn: 'কাউকে ডাকে' }], a: 0 },
        { q: { en: 'Which activity can make Tania feel better when she is sad?', bn: 'তানিয়ার মন খারাপ হলে কোন কাজটি তাকে ভালো অনুভব করাতে পারে?' }, o: [{ en: 'Talking to a close friend', bn: 'প্রিয় বন্ধুর সঙ্গে কথা' }, { en: 'Her favourite food', bn: 'পছন্দের খাবার' }, { en: 'A little outing', bn: 'একটু ঘোরাঘুরি' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'What is the most likely reason for Tania to sulk?', bn: 'তানিয়া কোন কারণে সবচেয়ে বেশি অভিমান করতে পারে?' }, o: [{ en: 'Being neglected', bn: 'অবহেলা' }, { en: 'Promises not being kept', bn: 'কথা না রাখা' }, { en: 'Being misunderstood', bn: 'ভুল বোঝা' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'When Tania is hurt, does she easily show it?', bn: 'তানিয়া কষ্ট পেলে কি সহজে তা প্রকাশ করে?' }, o: [{ en: 'She tells everyone', bn: 'সবাইকে বলে' }, { en: 'She tells no one', bn: 'কাউকে বলে না' }, { en: 'She tells only close people', bn: 'শুধু কাছের মানুষকে বলে' }, { en: 'She tells depending on the situation', bn: 'পরিস্থিতি বুঝে বলে' }], a: 1 },
        { q: { en: 'What matters most to Tania?', bn: 'তানিয়ার কাছে কোনটি বেশি গুরুত্বপূর্ণ?' }, o: [{ en: 'Trust', bn: 'বিশ্বাস' }, { en: 'Love', bn: 'ভালোবাসা' }, { en: 'Respect', bn: 'সম্মান' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'What truly makes Tania happy?', bn: 'তানিয়াকে সত্যি খুশি করতে কোনটি সবচেয়ে কার্যকর?' }, o: [{ en: 'Listening to her with attention', bn: 'মন দিয়ে তার কথা শোনা' }, { en: 'An expensive gift', bn: 'দামি উপহার' }, { en: 'Only praise', bn: 'শুধু প্রশংসা' }, { en: 'Agreeing with everything', bn: 'সব কথায় হ্যাঁ বলা' }], a: 0 },
        { q: { en: 'What kind of people does Tania feel most at ease with?', bn: 'তানিয়া কোন ধরনের মানুষের সঙ্গে বেশি স্বচ্ছন্দ বোধ করে?' }, o: [{ en: 'Those who understand her', bn: 'যারা তাকে বোঝে' }, { en: 'Those who respect her', bn: 'যারা সম্মান করে' }, { en: 'Those who stand by her', bn: 'যারা পাশে থাকে' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'When Tania meets someone new for the first time, how might she be?', bn: 'তানিয়া নতুন কারও সঙ্গে প্রথম দেখা হলে কেমন হতে পারে?' }, o: [{ en: 'A little quiet at first', bn: 'প্রথমে একটু চুপচাপ' }, { en: 'Instantly very friendly', bn: 'সঙ্গে সঙ্গেই খুব মিশুক' }, { en: 'Does not talk at all', bn: 'একদম কথা বলে না' }, { en: 'Mixes in depending on the person', bn: 'মানুষ বুঝে মেশে' }], a: 0 },
        { q: { en: 'What does friendship mean to Tania?', bn: 'তানিয়ার কাছে বন্ধুত্ব মানে কী?' }, o: [{ en: 'Only going out together', bn: 'শুধু একসঙ্গে ঘোরা' }, { en: 'Only talking', bn: 'শুধু কথা বলা' }, { en: 'Trust, care and being there', bn: 'বিশ্বাস, যত্ন ও পাশে থাকা' }, { en: 'Keeping in touch only when needed', bn: 'প্রয়োজনে যোগাযোগ' }], a: 2 },
        { q: { en: 'What can Tania do for a friend?', bn: 'তানিয়া বন্ধুর জন্য কোন কাজটি করতে পারে?' }, o: [{ en: 'Make time', bn: 'সময় বের করা' }, { en: 'Listen attentively', bn: 'মন দিয়ে শোনা' }, { en: 'Stand by them in trouble', bn: 'বিপদে পাশে থাকা' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'What will Tania remember most after visiting a place?', bn: 'তানিয়া কোনো জায়গায় ঘুরতে গিয়ে সবচেয়ে বেশি কী মনে রাখবে?' }, o: [{ en: 'The beauty of the place', bn: 'জায়গার সৌন্দর্য' }, { en: 'The way back home', bn: 'বাড়ি ফিরে আসার পথ' }, { en: 'The taste of the food', bn: 'খাবারের স্বাদ' }, { en: 'The funny events of that day', bn: 'সেদিনের মজার ঘটনা' }], a: 0 },
        { q: { en: 'In the memories of 2022/23 outings, which two friends\' names come up together?', bn: '২০২২/২৩ সালের ঘোরাঘুরির স্মৃতিতে কোন দুই বন্ধুর নাম একসঙ্গে আসে?' }, o: [{ en: 'Lithi and Shupti', bn: 'লিথি ও শুপ্তি' }, { en: 'Toa and Taiba', bn: 'তোয়া ও তাইবা' }, { en: 'Sadia and Toa', bn: 'সাদিয়া ও তোয়া' }, { en: 'Taiba and Sadia', bn: 'তাইবা ও সাদিয়া' }], a: 0 },
        { q: { en: 'Which period of Tania\'s life is not clearly remembered because she was very young?', bn: 'তানিয়ার জীবনের কোন সময়ের কথা তার খুব ছোট হওয়ার কারণে স্পষ্ট মনে নেই?' }, o: [{ en: 'The early school years in early childhood', bn: 'একেবারে ছোটবেলার স্কুলের বছরগুলো' }, { en: 'College years', bn: 'কলেজের সময়' }, { en: 'The time of 2022', bn: '২০২২ সালের সময়' }, { en: 'The time of 2019', bn: '২০১৯ সালের সময়' }], a: 0 },
        { q: { en: 'If Tania\'s memories are arranged in order, which comes first?', bn: 'তানিয়ার জীবনের স্মৃতিগুলো সাজালে কোনটি আগে আসবে?' }, o: [{ en: 'Friendship with Toa', bn: 'তোয়ার সঙ্গে বন্ধুত্ব' }, { en: 'Friendship with Sadia', bn: 'সাদিয়ার সঙ্গে বন্ধুত্ব' }, { en: 'Friendship with Taiba', bn: 'তাইবার সঙ্গে বন্ধুত্ব' }, { en: 'Outings with Lithi and Shupti', bn: 'লিথি-শুপ্তির সঙ্গে ঘোরাঘুরি' }], a: 1 },
        { q: { en: 'In Tania\'s story, which year came before her friendship with Sadia?', bn: 'তানিয়ার গল্পে কোন সালটি সাদিয়ার বন্ধুত্বের আগে?' }, o: [{ en: '2015', bn: '২০১৫' }, { en: '2018', bn: '২০১৮' }, { en: '2022', bn: '২০২২' }, { en: '2023', bn: '২০২৩' }], a: 0 },
        { q: { en: 'What kind of question would be the hardest in the quiz about Tania?', bn: 'তানিয়াকে নিয়ে কুইজে সবচেয়ে কঠিন প্রশ্ন কোন ধরনের হবে?' }, o: [{ en: 'Her small habits', bn: 'তার ছোট ছোট অভ্যাস' }, { en: 'Her favourite food', bn: 'তার প্রিয় খাবার' }, { en: 'Her fears', bn: 'তার ভয়ের বিষয়' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'If Tania wants to be on her own one day and drop everything, what might she choose?', bn: 'তানিয়া যদি একদিন সব কাজ বাদ দিয়ে নিজের মতো থাকতে চায়, সে কী বেছে নিতে পারে?' }, o: [{ en: 'Sleep and rest', bn: 'ঘুম ও বিশ্রাম' }, { en: 'Favourite songs', bn: 'প্রিয় গান' }, { en: 'A little quiet time', bn: 'একটু নিরিবিলি সময়' }, { en: 'Whatever she feels like', bn: 'যেটা তার মন চায়' }], a: 2 },
        { q: { en: 'Why are friends important in Tania\'s life?', bn: 'তানিয়ার জীবনে বন্ধুরা কেন গুরুত্বপূর্ণ?' }, o: [{ en: 'They create memories', bn: 'স্মৃতি তৈরি করে' }, { en: 'They stand by her in hard times', bn: 'কঠিন সময়ে পাশে থাকে' }, { en: 'They share joy', bn: 'আনন্দ ভাগ করে' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'Which part of the time spent with Tania will be remembered most?', bn: 'তানিয়ার সঙ্গে কাটানো সময়ের কোন জিনিসটি সবচেয়ে বেশি মনে থাকবে?' }, o: [{ en: 'Her smile', bn: 'হাসি' }, { en: 'Her mischief', bn: 'দুষ্টুমি' }, { en: 'The outings', bn: 'ঘোরাঘুরি' }, { en: 'All of these', bn: 'সবগুলো' }], a: 3 },
        { q: { en: 'Which word suits Tania\'s good qualities most?', bn: 'তানিয়ার ভালো দিকের সঙ্গে কোন শব্দটি সবচেয়ে বেশি মানায়?' }, o: [{ en: 'Affection', bn: 'মায়া' }, { en: 'Honest and open', bn: 'সৎ ও খোলামেলা' }, { en: 'A kind heart', bn: 'দয়ালু মন' }, { en: 'All of these', bn: 'সবগুলো' }], a: 0 },
        { q: { en: 'What is the biggest proof of really knowing Tania?', bn: 'শেষ প্রশ্ন: তানিয়াকে সত্যি চেনার সবচেয়ে বড় প্রমাণ কী?' }, o: [{ en: 'Knowing her favourite colour', bn: 'তার প্রিয় রং জানা' }, { en: 'Knowing her favourite food', bn: 'তার প্রিয় খাবার জানা' }, { en: 'Understanding her good and bad sides and standing by her', bn: 'তার ভালো-মন্দ বুঝে পাশে থাকা' }, { en: 'Knowing the names of all her friends', bn: 'তার সব বন্ধুর নাম জানা' }], a: 2 },
        { q: { en: 'When Tania is returning from an outing, what might she say most?', bn: 'তানিয়ার সঙ্গে বেড়াতে গিয়ে ফেরার সময় কোন কথাটি সে বেশি বলতে পারে?' }, o: [{ en: 'It would have been nice to stay a little longer', bn: 'আরেকটু থাকলে ভালো হতো' }, { en: 'Let\'s come again', bn: 'চলো আবার আসব' }, { en: 'Today was a lot of fun', bn: 'আজ অনেক মজা হয়েছে' }, { en: 'All of these could be true', bn: 'সবগুলোই হতে পারে' }], a: 3 },
        { q: { en: 'If Tania calls someone suddenly, what is the most likely reason?', bn: 'তানিয়া যদি হঠাৎ কাউকে ফোন করে, সবচেয়ে সম্ভাব্য কারণ কী?' }, o: [{ en: 'She wants to tell a story', bn: 'কোনো গল্প বলবে' }, { en: 'A plan to go somewhere', bn: 'কোথাও যাওয়ার পরিকল্পনা' }, { en: 'To share some news', bn: 'কোনো খবর জানাবে' }, { en: 'She is thinking of them and wants to check on them', bn: 'যার কথা মনে পড়েছে তার খোঁজ নেবে' }], a: 3 },
        { q: { en: 'What kind of memory about Tania could be the funniest?', bn: 'তানিয়াকে নিয়ে সবচেয়ে মজার স্মৃতি কোন ধরনের হতে পারে?' }, o: [{ en: 'A sudden outing', bn: 'হঠাৎ বেড়াতে যাওয়া' }, { en: 'Spending time laughing together', bn: 'একসঙ্গে হাসতে হাসতে সময় কাটানো' }, { en: 'Small pranks', bn: 'ছোটখাটো দুষ্টুমি' }, { en: 'All of these', bn: 'সবগুলো' }], a: 0 },
        { q: { en: 'If Tania plans a day out with friends, what might she choose?', bn: 'তানিয়া যদি বন্ধুদের সঙ্গে একদিনের জন্য পরিকল্পনা করে, কোনটি বেছে নিতে পারে?' }, o: [{ en: 'Eating and adda', bn: 'খাওয়া ও আড্ডা' }, { en: 'Going around and photos', bn: 'ঘোরাঘুরি ও ছবি' }, { en: 'Chatting at home', bn: 'বাসায় বসে গল্প' }, { en: 'A day that feels just right', bn: 'মনের মতো একটি দিন' }], a: 3 },
        { q: { en: 'Which memory is the most precious to keep?', bn: 'তানিয়ার কাছে কোন স্মৃতিটি সবচেয়ে বেশি যত্নে রাখার মতো?' }, o: [{ en: 'An old friendship', bn: 'পুরোনো বন্ধুত্ব' }, { en: 'Time spent together', bn: 'একসঙ্গে কাটানো সময়' }, { en: 'Being with someone in hard times', bn: 'কঠিন সময়ে পাশে পাওয়া মানুষ' }, { en: 'All of these', bn: 'সবগুলো' }], a: 1 }
    ];
    const COUNT = 10;   // questions per game: 10 are picked at random from the bank

    const T = {
        en: { title: 'How well do you know her?', intro: 'Answer 10 random questions and find out how well you know Tania.',
              start: 'Start', submit: 'Submit', replay: 'Play again', right: 'correct answers',
              hi: 'Great job! You really know me quite well.',
              mid: 'Nice effort! A bit more and you will know me completely. Want to hear a few more stories?',
              low: 'We are still a bit like strangers, and that is totally fine. Let us get to know each other, little by little!',
              full: 'All correct! Wow, you really know me inside out. Thank you for paying so much attention, it made me really happy!' },
        bn: { title: 'তাকে তুমি কতটা চেনো?', intro: 'এলোমেলো ১০টি প্রশ্নের উত্তর দাও, দেখো তানিয়াকে তুমি কতটা চেনো।',
              start: 'শুরু করো', submit: 'সাবমিট', replay: 'আবার খেলো', right: 'সঠিক উত্তর',
              hi: 'দারুণ করেছো! তুমি তো আমাকে বেশ ভালোই চেনো।',
              mid: 'ভালোই হয়েছে! আরেকটু চেষ্টা করলে পুরোটাই চিনে ফেলবে। আমার আরও কিছু গল্প শুনবে?',
              low: 'আমরা তো এখনো একটু অপরিচিত, কোনো সমস্যা নেই। চলো, একটু একটু করে একে অপরকে জানি!',
              full: 'সব কটা উত্তর ঠিক! বাহ, তুমি তো আমাকে একদম ভেতর থেকে চেনো। এত মন দিয়ে খেয়াল করার জন্য ধন্যবাদ, সত্যিই ভালো লাগলো!' }
    };
    const lang = () => (document.documentElement.lang === 'bn' ? 'bn' : 'en');

    let qs = [], idx = 0, score = 0, picked = -1, view = 'intro', busy = false;

    function shuffle(a) {
        a = a.slice();
        for (let k = a.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [a[k], a[r]] = [a[r], a[k]]; }
        return a;
    }
    function start() {
        qs = shuffle(BANK).slice(0, Math.min(COUNT, BANK.length));
        idx = 0; score = 0; picked = -1; view = 'q'; busy = false;
        render(false);
    }
    function countPct(target) {
        const el = document.getElementById('qz-pct');
        if (!el) return;
        const t0 = performance.now();
        const step = now => {
            const k = Math.min(1, (now - t0) / 1200);
            el.textContent = String(Math.round(target * (1 - Math.pow(1 - k, 3))));
            if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // enter = true when a new question card should flip in
    function render(enter) {
        const L = T[lang()], n = qs.length;
        let card = '', hasNext = false;
        if (view === 'intro') {
            box.innerHTML = '<h2 class="qz-title">' + L.title + '</h2>' +
                '<p class="qz-intro">' + L.intro + '</p>' +
                '<div class="qz-center"><button type="button" class="qz-btn" data-act="start">' + L.start + '</button></div>';
            return;
        }
        if (view === 'q') {
            const Q = qs[idx];
            hasNext = idx + 1 < n;
            card = '<div class="qz-top"><span class="qz-count">' + (idx + 1) + ' / ' + n + '</span>' +
                '<div class="qz-bar"><i style="width:' + (idx / n * 100) + '%"></i></div></div>' +
                '<p class="qz-q">' + Q.q[lang()] + '</p>' +
                '<div class="qz-opts">' + Q.o.map((o, k) =>
                    '<button type="button" class="qz-opt' + (k === picked ? ' sel' : '') + '" data-act="pick" data-k="' + k + '">' +
                    '<span class="qz-tick"></span><span>' + o[lang()] + '</span></button>').join('') + '</div>' +
                '';
        } else {
            const pct = Math.round(score / n * 100);
            const msg = score === n ? L.full : pct >= 80 ? L.hi : pct >= 50 ? L.mid : L.low;
            card = '<div class="qz-end">' +
                '<div class="qz-tania"><svg viewBox="0 0 64 40" class="qz-lotus"><use href="#lotus"/></svg></div>' +
                '<div class="qz-bubble">' + msg + '</div>' +
                '<div class="qz-pct"><b id="qz-pct">0</b>%</div>' +
                '<p class="qz-sub">' + score + ' / ' + n + ' ' + L.right + '</p>' +
                '<button type="button" class="qz-btn" data-act="start">' + L.replay + '</button></div>';
        }
        box.innerHTML = '<h2 class="qz-title">' + L.title + '</h2>' +
            '<div class="qz-stack' + (hasNext ? ' more' : '') + '">' +
            '<div class="qz-card' + (enter ? ' enter' : '') + '">' + card + '</div></div>';
        if (view === 'end') countPct(Math.round(score / n * 100));
    }

    box.addEventListener('click', e => {
        const el = e.target.closest('[data-act]');
        if (!el || el.disabled || busy) return;
        const act = el.dataset.act;
        if (act === 'start') start();
        else if (act === 'pick') {
            // one tap on an answer is the answer: it is marked, the card slides away and the next one comes in
            picked = +el.dataset.k;
            busy = true;
            if (picked === qs[idx].a) score++;
            const card = box.querySelector('.qz-card');
            if (card) card.classList.add('flip-out');
            setTimeout(() => {
                busy = false;
                if (idx + 1 < qs.length) { idx++; picked = -1; render(true); }
                else { view = 'end'; render(false); }
            }, 480);
        }
    });

    // switch language with the site's EN / বাংলা button
    new MutationObserver(() => { if (view !== 'end') render(false); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render(false);
})();
