/**
 * عاجل نيوز - نظام التصنيف الذكي الاحترافي
 * تصنيف متعدد المستويات مع التعرف على الكيانات المسماة (NER)
 * يدعم: لاعبين، أندية، دول، مؤسسات، أحداث، أسواق
 */

const SmartCategorizer = {

    // ===== MAIN CATEGORIES =====
    categories: {
        sports: { name: 'رياضة', icon: '⚽', slug: 'sports' },
        economy: { name: 'اقتصاد', icon: '💰', slug: 'economy' },
        international: { name: 'مدارات عالمية', icon: '🌍', slug: 'international' },
        local: { name: 'المحليات', icon: '🏛️', slug: 'local' },
        entertainment: { name: 'الترفيه', icon: '🎭', slug: 'entertainment' },
        tourism: { name: 'سياحة وسفر', icon: '✈️', slug: 'tourism' },
        technology: { name: 'تقنية', icon: '💻', slug: 'technology' },
        health: { name: 'صحة', icon: '🏥', slug: 'health' },
        science: { name: 'علوم', icon: '🔬', slug: 'science' },
        society: { name: 'مجتمع', icon: '👥', slug: 'society' },
        jobs: { name: 'وظائف', icon: '💼', slug: 'jobs' },
        worldcup: { name: 'المونديال', icon: '🏆', slug: 'worldcup' },
    },

    // ===== SPORTS DATABASE =====
    sports: {
        // Football Players (World Class)
        players: {
            'ميسي': { team: 'إنتر ميامي', country: 'الأرجنتين', sport: 'كرة قدم' },
            'رونالدو': { team: 'النصر', country: 'البرتغال', sport: 'كرة قدم' },
            'مبابي': { team: 'ريال مدريد', country: 'فرنسا', sport: 'كرة قدم' },
            'هالاند': { team: 'مانشستر سيتي', country: 'النرويج', sport: 'كرة قدم' },
            'نيمار': { team: 'الهلال', country: 'البرازيل', sport: 'كرة قدم' },
            'صلاح': { team: 'ليفربول', country: 'مصر', sport: 'كرة قدم' },
            'بنزيما': { team: 'الاتحاد', country: 'فرنسا', sport: 'كرة قدم' },
            'دي بروين': { team: 'مانشستر سيتي', country: 'بلجيكا', sport: 'كرة قدم' },
            'بيلينغهام': { team: 'ريال مدريد', country: 'إنجلترا', sport: 'كرة قدم' },
            'فينيسيوس': { team: 'ريال مدريد', country: 'البرازيل', sport: 'كرة قدم' },
            'يامال': { team: 'برشلونة', country: 'إسبانيا', sport: 'كرة قدم' },
            'باديلي': { team: 'برشلونة', country: 'إسبانيا', sport: 'كرة قدم' },
            'رودريغو': { team: 'ريال مدريد', country: 'البرازيل', sport: 'كرة قدم' },
            'كروس': { team: 'ريال مدريد', country: 'ألمانيا', sport: 'كرة قدم' },
            'مودريتش': { team: 'ريال مدريد', country: 'كرواتيا', sport: 'كرة قدم' },
            'ليفاندوفسكي': { team: 'برشلونة', country: 'بولندا', sport: 'كرة قدم' },
            'ساديو ماني': { team: 'النصر', country: 'السنغال', sport: 'كرة قدم' },
            'كانسيلو': { team: 'الهلال', country: 'البرتغال', sport: 'كرة قدم' },
            'كوليبالي': { team: 'الهلال', country: 'السنغال', sport: 'كرة قدم' },
            'كانتي': { team: 'الاتحاد', country: 'فرنسا', sport: 'كرة قدم' },
            'فوساتي': { team: 'برشلونة', country: 'إسبانيا', sport: 'كرة قدم' },
            'جواو فيلكس': { team: 'برشلونة', country: 'البرتغال', sport: 'كرة قدم' },
            'رشفورد': { team: 'مانشستر يونايتد', country: 'إنجلترا', sport: 'كرة قدم' },
            'سون': { team: 'توتنهام', country: 'كوريا الجنوبية', sport: 'كرة قدم' },
            'كين': { team: 'بايرن ميونخ', country: 'إنجلترا', sport: 'كرة قدم' },
            'غريزمان': { team: 'أتلتيكو مدريد', country: 'فرنسا', sport: 'كرة قدم' },
            'أوباميانغ': { team: 'الاتحاد', country: 'الغابون', sport: 'كرة قدم' },
            'حمدالله': { team: 'الاتحاد', country: 'المغرب', sport: 'كرة قدم' },
            'الشهري': { team: 'الهلال', country: 'السعودية', sport: 'كرة قدم' },
            'الدوسري': { team: 'الهلال', country: 'السعودية', sport: 'كرة قدم' },
            'كنو': { team: 'الهلال', country: 'السعودية', sport: 'كرة قدم' },
            'المقهو': { team: 'الأهلي', country: 'السعودية', sport: 'كرة قدم' },
            'البريكان': { team: 'الأهلي', country: 'السعودية', sport: 'كرة قدم' },
            'غريب': { team: 'الشباب', country: 'السعودية', sport: 'كرة قدم' },
            'تاليسكا': { team: 'النصر', country: 'البرازيل', sport: 'كرة قدم' },
            'أوتافيو': { team: 'النصر', country: 'البرتغال', sport: 'كرة قدم' },
            'لابورت': { team: 'النصر', country: 'إسبانيا', sport: 'كرة قدم' },
            'ماني': { team: 'النصر', country: 'السنغال', sport: 'كرة قدم' },
            'مارسيلو': { team: '', country: 'البرازيل', sport: 'كرة قدم' },
            'زيدان': { team: '', country: 'فرنسا', sport: 'كرة قدم' },
            'مسي': { team: 'إنتر ميامي', country: 'الأرجنتين', sport: 'كرة قدم' },
        },

        // Football Clubs
        clubs: {
            'ريال مدريد': { country: 'إسبانيا', league: 'الليغا' },
            'برشلونة': { country: 'إسبانيا', league: 'الليغا' },
            'مانشستر سيتي': { country: 'إنجلترا', league: 'البريمرليغ' },
            'ليفربول': { country: 'إنجلترا', league: 'البريمرليغ' },
            'أرسنال': { country: 'إنجلترا', league: 'البريمرليغ' },
            'مانشستر يونايتد': { country: 'إنجلترا', league: 'البريمرليغ' },
            'تشيلسي': { country: 'إنجلترا', league: 'البريمرليغ' },
            'توتنهام': { country: 'إنجلترا', league: 'البريمرليغ' },
            'بايرن ميونخ': { country: 'ألمانيا', league: 'البوندسليغا' },
            'باريس سان جيرمان': { country: 'فرنسا', league: 'الليغ1' },
            'باري سان جيرمان': { country: 'فرنسا', league: 'الليغ1' },
            'يوفنتوس': { country: 'إيطاليا', league: 'السيري آ' },
            'ميلان': { country: 'إيطاليا', league: 'السيري آ' },
            'إنتر ميلان': { country: 'إيطاليا', league: 'السيري آ' },
            'أتلتيكو مدريد': { country: 'إسبانيا', league: 'الليغا' },
            'بروسيا دورتموند': { country: 'ألمانيا', league: 'البوندسليغا' },
            'الهلال': { country: 'السعودية', league: 'دوري روشن' },
            'النصر': { country: 'السعودية', league: 'دوري روشن' },
            'الأهلي': { country: 'السعودية', league: 'دوري روشن' },
            'الاتحاد': { country: 'السعودية', league: 'دوري روشن' },
            'الشباب': { country: 'السعودية', league: 'دوري روشن' },
            'الاتفاق': { country: 'السعودية', league: 'دوري روشن' },
            'التعاون': { country: 'السعودية', league: 'دوري روشن' },
            'الفتح': { country: 'السعودية', league: 'دوري روشن' },
            'ضمك': { country: 'السعودية', league: 'دوري روشن' },
            'الرائد': { country: 'السعودية', league: 'دوري روشن' },
            'الفيحاء': { country: 'السعودية', league: 'دوري روشن' },
            'الوحدة': { country: 'السعودية', league: 'دوري روشن' },
            'العين': { country: 'الإمارات', league: 'دوري أدنوك' },
            'الوصل': { country: 'الإمارات', league: 'دوري أدنوك' },
            'الأهلي الإماراتي': { country: 'الإمارات', league: 'دوري أدنوك' },
            'الدحيل': { country: 'قطر', league: 'دوري نجوم قطر' },
            'السد': { country: 'قطر', league: 'دوري نجوم قطر' },
            'الأهلي المصري': { country: 'مصر', league: 'الدوري المصري' },
            'الزمالك': { country: 'مصر', league: 'الدوري المصري' },
            'الترجي': { country: 'تونس', league: 'الدوري التونسي' },
            'الوداد': { country: 'المغرب', league: 'الدوري المغربي' },
            'الرجاء': { country: 'المغرب', league: 'الدوري المغربي' },
            'إنتر ميامي': { country: 'أمريكا', league: 'MLS' },
        },

        // National Teams
        nationalTeams: {
            'السعودية': 'الأخضر', 'مصر': 'الفراعنة', 'المغرب': 'أسود الأطلس',
            'تونس': 'نسور قرطاج', 'الجزائر': 'الخضر', 'البرازيل': 'السيليساو',
            'الأرجنتين': 'راقصو التانغو', 'فرنسا': 'الديوك', 'ألمانيا': 'المانشافت',
            'إسبانيا': 'لاروخا', 'إنجلترا': 'الأسود الثلاثة', 'إيطاليا': 'الأزوري',
            'البرتغال': 'برازيل أوروبا', 'هولندا': 'الطواحين', 'بلجيكا': 'الشياطين الحمر',
            'كرواتيا': 'مربعات الشطرنج', 'أمريكا': 'TEAM USA', 'اليابان': 'الساموراي',
            'كوريا الجنوبية': 'محاربي تايغوك', 'أستراليا': 'الكانgarوos',
            'كندا': 'القيقب', 'إيران': 'إيران', 'الصين': 'التنين',
        },

        // Competitions
        competitions: {
            'كأس العالم': { type: 'دولي', sport: 'كرة قدم' },
            'مونديال': { type: 'دولي', sport: 'كرة قدم' },
            'كأس آسيا': { type: 'قاري', sport: 'كرة قدم' },
            'دوري أبطال أوروبا': { type: 'قاري', sport: 'كرة قدم' },
            'تشامبيونزليغ': { type: 'قاري', sport: 'كرة قدم' },
            'الدوري الإنجليزي': { type: 'محلي', sport: 'كرة قدم' },
            'البريمرليغ': { type: 'محلي', sport: 'كرة قدم' },
            'الليغا': { type: 'محلي', sport: 'كرة قدم' },
            'البوندسليغا': { type: 'محلي', sport: 'كرة قدم' },
            'السيري آ': { type: 'محلي', sport: 'كرة قدم' },
            'الليغ1': { type: 'محلي', sport: 'كرة قدم' },
            'دوري روشن': { type: 'محلي', sport: 'كرة قدم' },
            'كأس الملك': { type: 'محلي', sport: 'كرة قدم' },
            'كأس ولي العهد': { type: 'محلي', sport: 'كرة قدم' },
            'كأس السوبر': { type: 'محلي', sport: 'كرة قدم' },
            'كأس العالم للأندية': { type: 'دولي', sport: 'كرة قدم' },
            'يورو': { type: 'قاري', sport: 'كرة قدم' },
            'كوبا أمريكا': { type: 'قاري', sport: 'كرة قدم' },
            'دوري الأمم الأوروبية': { type: 'دولي', sport: 'كرة قدم' },
            'الأولمبياد': { type: 'دولي', sport: 'متعدد' },
            'الألعاب الأولمبية': { type: 'دولي', sport: 'متعدد' },
            'فورمولا 1': { type: 'دولي', sport: 'سباق سيارات' },
            'F1': { type: 'دولي', sport: 'سباق سيارات' },
            'imbledon': { type: 'دولي', sport: 'تنس' },
            'NBA': { type: 'محلي', sport: 'كرة سلة' },
            'دوري كرة السلة الأمريكي': { type: 'محلي', sport: 'كرة سلة' },
            'كأس الاتحاد الإنجليزي': { type: 'محلي', sport: 'كرة قدم' },
            'FA Cup': { type: 'محلي', sport: 'كرة قدم' },
        },

        // Sports terms
        terms: [
            'هدف', 'أهداف', 'مباراة', 'نهائي', 'نصف نهائي', 'ربع نهائي',
            'دور الـ16', 'دور الـ32', 'إقصاء', 'تأهل', 'صعود', 'هبوط',
            'بطولة', 'كأس', 'دوري', 'مدرب', 'لاعب', 'فريق', 'نادي',
            'ملعب', 'جمهور', 'جماهير', 'حكم', 'تسلل', 'ركلة جزاء',
            'ركلة حرة', 'صفراء', 'حمراء', 'تبديل', 'إقصاء', 'تعادل',
            'فوز', 'خسارة', 'تسجيل', 'صناعة', 'تمريرة', 'تسديدة',
            'حارس', 'مدافع', 'وسط', 'مهاجم', 'قائد', 'احتياط',
            'عقد', 'صفقة', 'انتقال', 'إعارة', 'تجديد', 'رحيل',
            'goal', 'match', 'final', 'score', 'penalty', 'red card',
            'yellow card', 'coach', 'player', 'team', 'transfer', 'injury',
            'hat-trick', 'assist', 'offside', 'substitute', 'captain',
        ],

        // Other sports
        otherSports: [
            'تنس', 'غolf', 'سباحة', 'ملاكمة', 'مصارعة', 'رياضة إلكترونية',
            'كرة سلة', 'كرة طائرة', 'كرة يد', 'ركوب الخيل', 'سباق',
            'فورمولا', 'سباق سيارات', 'دراجات', 'ألعاب القوى',
            'جودو', 'كاراتيه', 'تايكوندو', 'مبارزة', 'رماية',
            'tennis', 'golf', 'swimming', 'boxing', 'basketball', 'volball',
            'esports', 'formula', 'racing', 'athletics', 'mma', 'ufc',
        ],
    },

    // ===== ECONOMY DATABASE =====
    economy: {
        // Companies & Organizations
        companies: {
            'أرامكو': { type: 'شركة نفط', country: 'السعودية' },
            'سابك': { type: 'بتروكيماويات', country: 'السعودية' },
            'stc': { type: 'اتصالات', country: 'السعودية' },
            'الاتصالات السعودية': { type: 'اتصالات', country: 'السعودية' },
            'زين': { type: 'اتصالات', country: 'الكويت' },
            'اتصالات': { type: 'اتصالات', country: 'الإمارات' },
            'أبل': { type: 'تقنية', country: 'أمريكا' },
            'Apple': { type: 'تقنية', country: 'أمريكا' },
            'جوجل': { type: 'تقنية', country: 'أمريكا' },
            'Google': { type: 'تقنية', country: 'أمريكا' },
            'مايكروسوفت': { type: 'تقنية', country: 'أمريكا' },
            'Microsoft': { type: 'تقنية', country: 'أمريكا' },
            'أمازون': { type: 'تجارة إلكترونية', country: 'أمريكا' },
            'Amazon': { type: 'تجارة إلكترونية', country: 'أمريكا' },
            'تسلا': { type: 'سيارات كهربائية', country: 'أمريكا' },
            'Tesla': { type: 'سيارات كهربائية', country: 'أمريكا' },
            'سامسونغ': { type: 'تقنية', country: 'كوريا' },
            'Samsung': { type: 'تقنية', country: 'كوريا' },
            'أوبك': { type: 'منظمة نفط', country: 'دولية' },
            'OPEC': { type: 'منظمة نفط', country: 'دولية' },
            'بنك أمريكا': { type: 'بنك', country: 'أمريكا' },
            'JP مورغان': { type: 'بنك', country: 'أمريكا' },
            'بنك الصين': { type: 'بنك', country: 'الصين' },
            'صندوق النقد الدولي': { type: 'منظمة مالية', country: 'دولية' },
            'IMF': { type: 'منظمة مالية', country: 'دولية' },
            'البنك الدولي': { type: 'منظمة مالية', country: 'دولية' },
            'FED': { type: 'بنك مركزي', country: 'أمريكا' },
            'الاحتياطي الفيدرالي': { type: 'بنك مركزي', country: 'أمريكا' },
            'البنك المركزي الأوروبي': { type: 'بنك مركزي', country: 'أوروبا' },
            'بنكꫲي': { type: 'بنك مركزي', country: 'بريطانيا' },
            'بلومبرغ': { type: 'وكالة أنباء مالية', country: 'أمريكا' },
            'رويترز': { type: 'وكالة أنباء', country: 'بريطانيا' },
            'وول ستريت': { type: 'سوق أسهم', country: 'أمريكا' },
            'وول ستريت جورنال': { type: 'صحيفة مالية', country: 'أمريكا' },
            'رتال': { type: 'تطوير عقاري', country: 'السعودية' },
            'روشن': { type: 'تطوير عقاري', country: 'السعودية' },
            'نيوم': { type: 'مشروع مستقبلي', country: 'السعودية' },
            'القدية': { type: 'مشروع ترفيهي', country: 'السعودية' },
            'مشروع البحر الأحمر': { type: 'سياحة', country: 'السعودية' },
        },

        // Economy terms
        terms: [
            'نفط', 'برميل', 'خام', 'بترول', 'غاز', 'طاقة', 'كهرباء',
            'أسهم', 'سهم', 'بورصة', 'تداول', 'سوق الأسهم', 'مؤشر',
            'استثمار', 'مستثمر', 'استثماري', 'محفظة', 'صناديق',
            'مصرف', 'بنك', 'مصرفية', 'تمويل', 'قرض', 'فائدة', 'ربح', 'خسارة',
            'ريال', 'دولار', 'يورو', 'ين', 'جنيه', 'درهم', 'عملة', 'صرف',
            'تضخم', 'انكماش', 'نمو', 'ركود', 'أزمة', 'انتعاش',
            'تجارة', 'واردات', 'صادرات', 'ميزان تجاري', 'جمارك',
            'عقارات', 'تطوير عقاري', 'سكن', 'أراضي', 'مشاريع',
            'رواتب', 'وظائف', 'توظيف', 'بطالة', 'دخل', 'ضرائب',
            'تقشف', 'دعم', 'إعانات', 'موازنة', 'عجز', 'فائض',
            'bitcoin', 'bitcoin', 'crypto', 'blockchain', 'عملات رقمية',
            'oil', 'stock', 'market', 'investment', 'inflation', 'gdp',
            'interest rate', 'trade', 'export', 'import', 'recession',
            'Wall Street', 'S&P', 'Dow Jones', 'NASDAQ', 'أوبك',
            'الناتج المحلي', 'الناتج القومي', 'الاقتصاد الكلي',
            'الاقتصاد الجزئي', 'رأسمال', 'ربحية', 'خسارة',
        ],

        // Saudi economy specific
        saudi: [
            'رؤية 2030', 'صندوق الاستثمارات العامة', 'الهيئة العامة للترفيه',
            'الهيئة السعودية للبيانات والذكاء الاصطناعي', 'سداد',
            'منصة', 'تحول رقمي', 'اقتصاد المعرفة',
        ],
    },

    // ===== INTERNATIONAL DATABASE =====
    international: {
        // Countries
        countries: {
            'أمريكا': ['الولايات المتحدة', 'أمريكا', 'واشنطن', 'البيت الأبيض', 'الكونغرس', 'الشيوخ'],
            'روسيا': ['روسيا', 'موسكو', 'بوتين', 'كرملين', 'الاتحاد الروسي'],
            'الصين': ['الصين', 'بكين', 'الصين الشعبية', 'بكين'],
            'فرنسا': ['فرنسا', 'باريس', 'الإليزيه', 'ماكرون'],
            'ألمانيا': ['ألمانيا', 'برلين', 'شولتس'],
            'بريطانيا': ['بريطانيا', 'لندن', 'المملكة المتحدة', 'وستمنستر'],
            'إيطاليا': ['إيطاليا', 'روما'],
            'إسبانيا': ['إسبانيا', 'مدريد'],
            'اليابان': ['اليابان', 'طوكيو'],
            'كوريا': ['كوريا', 'سيول', 'كوريا الجنوبية'],
            'إيران': ['إيران', 'طهران', 'خامنئي', 'الحرس الثوري'],
            'تركيا': ['تركيا', 'أنقرة', 'إسطنبول', 'أردوغان'],
            'إسرائيل': ['إسرائيل', 'تل أبيب', 'الكنيست', 'نتنياهو'],
            'فلسطين': ['فلسطين', 'غزة', 'الضفة', 'القدس', 'حماس', 'فتح'],
            'مصر': ['مصر', 'القاهرة', 'السيسي'],
            'العراق': ['العراق', 'بغداد'],
            'سوريا': ['سوريا', 'دمشق', 'الأسد'],
            'لبنان': ['لبنان', 'بيروت', 'حزب الله'],
            'الأردن': ['الأردن', 'عمان'],
            'الإمارات': ['الإمارات', 'أبوظبي', 'دبي'],
            'قطر': ['قطر', 'الدوحة'],
            'الكويت': ['الكويت'],
            'البحرين': ['البحرين', 'المنامة'],
            'عُمان': ['عُمان', 'مسقط'],
            'اليمن': ['اليمن', 'صنعاء', 'عدن', 'الحوثي'],
            'السودان': ['السودان', 'الخرطوم'],
            'ليبيا': ['ليبيا', 'طرابلس'],
            'تونس': ['تونس'],
            'الجزائر': ['الجزائر'],
            'المغرب': ['المغرب', 'الرباط'],
            'الهند': ['الهند', 'نيودلهي', 'مودي'],
            'باكستان': ['باكستان', 'إسلام آباد'],
            'أفغانستان': ['أفغانستان', 'كابول', 'طالبان'],
            'أوكرانيا': ['أوكرانيا', 'كييف', 'زيلينسكي'],
        },

        // International organizations
        organizations: [
            'الأمم المتحدة', 'UN', 'مجلس الأمن', 'اليونسكو',
            'حلف الناتو', 'NATO', 'الاتحاد الأوروبي', 'البرلمان الأوروبي',
            'منظمة الصحة العالمية', 'WHO', 'منظمة التجارة العالمية',
            'الأوبك', 'OPEC', 'مجموعة العشرين', 'G20', 'مجموعة السبع', 'G7',
            'محكمة العدل الدولية', 'المحكمة الجنائية الدولية',
            'الجامعة العربية', 'منظمة التعاون الإسلامي',
        ],

        // International leaders
        leaders: {
            'ترامب': 'أمريكا', 'بايدن': 'أمريكا', 'بوتين': 'روسيا',
            'ماكرون': 'فرنسا', 'شولتس': 'ألمانيا', 'sunak': 'بريطانيا',
            'سوناك': 'بريطانيا', 'ملوني': 'إيطاليا', 'أوربان': 'المجر',
            'إردوغان': 'تركيا', 'خامنئي': 'إيران', 'السيسي': 'مصر',
            'نتنياهو': 'إسرائيل', 'زيلينسكي': 'أوكرانيا',
            'كيم جونغ أون': 'كوريا الشمالية', 'مودي': 'الهند',
            'بن سلمان': 'السعودية', 'سلمان': 'السعودية',
        },

        // Conflicts & events
        events: [
            'حرب', 'سلام', 'مفاوضات', 'اتفاق', 'اتفاقية', 'معاهدة',
            'عقوبات', 'حصار', 'embargo', 'sanctions', 'tariffs',
            'انقلاب', 'ثورة', 'احتجاج', 'مظاهرات', 'أزمة',
            'زلزال', 'فيضان', 'إعصار', 'كارثة', 'طوارئ',
            'إرهاب', 'هجمات', 'أمن', 'استخبارات',
        ],
    },

    // ===== ENTERTAINMENT DATABASE =====
    entertainment: {
        terms: [
            'فن', 'فيلم', 'مسلسل', 'ممثل', 'ممثلة', 'مغن', 'مغنية',
            'حفل', 'حفلة', '콘서트', 'أغنية', 'ألبوم', 'تصوير',
            '导演', 'سينما', 'تلفزيون', 'بث', 'منصة', 'نتفلكس', 'Netflix',
            'Disney', 'ديزني', 'Amazon Prime', 'Apple TV',
            'ترفيه', 'ألعاب', 'مسلسلات', 'أنمي', 'رسوم متحركة',
            'Reality', 'واقع', 'برنامج', 'تقديم', 'مقدم',
            'celebrity', 'celeb', 'actor', 'actress', 'singer', 'movie',
            'TV show', 'concert', 'album', 'song', 'film', 'director',
            'أوسكار', 'Grammy', 'Emmy', 'Festival', 'مهرجان',
            'تيك توك', 'TikTok', 'يوتيوب', 'YouTube', 'إنستغرام',
            'Twitch', 'سناب شات', 'Snapchat',
        ],

        // Arab celebrities
        celebrities: [
            'أحلام', 'عمرو دياب', 'تامر حسني', 'محمد_عساف', 'نانسي عجرم',
            'إليسا', 'شيرين', 'كاظم الساهر', 'عبدالحليم', 'أم كلثوم',
            'محمد رمضان', 'أحمد حلمي', 'منى زكي', 'ياسمين_العوض',
            'تيلور سويفت', 'بيونسيه', 'ريهانا', 'دريك', 'جو بايدن',
            'إيلون ماسك', 'جيف بيزوس',
        ],
    },

    // ===== TOURISM DATABASE =====
    tourism: {
        terms: [
            'سياحة', 'سفر', 'فندق', 'منتجع', 'مطار', 'طيران',
            'رحلة', 'وجهة', 'سياحي', 'زوار', 'سياح',
            'حج', 'عمرة', 'الحرم', 'المدينة', 'مكة',
            ' турист', 'tourism', 'travel', 'hotel', 'resort', 'airport',
            'flight', 'destination', 'tourist', 'visitor', 'booking',
            'visa', 'فيزا', 'جواز سفر', 'هجرة',
            'شواطئ', 'جبال', 'صحراء', 'جزر', 'منتجعات',
            'العلا', 'نيوم', 'الرياض', 'جدة', 'أبها', 'الباحة',
            'الدوحة', 'دبي', 'أبوظبي', 'اسطنبول', 'باريس',
            'لندن', 'نيويورك', 'طوكيو', 'بانكوك', 'بالي',
        ],
    },

    // ===== HEALTH DATABASE =====
    health: {
        terms: [
            'صحة', 'مرض', 'علاج', 'دواء', 'مستشفى', 'طبيب',
            'وباء', 'جائحة', 'لقاح', 'تطعيم', 'فيروس',
            'كورونا', 'كوفيد', 'COVID', 'SARS',
            'قلب', 'سرطان', 'سكري', 'ضغط', 'كلى',
            'جراحة', 'عملية', 'تشخيص', 'أعراض', 'علاج',
            'صحة نفسية', 'اكتئاب', 'قلق', 'نوم',
            'تغذية', 'رجيم', 'سمنة', 'وزن', 'رياضة صحية',
            'DNA', 'جينات', 'خلايا جذعية', 'ذكاء اصطناعي طبي',
            'صحة', 'صحة عامة', 'منظمة الصحة', 'WHO',
        ],
    },

    // ===== TECHNOLOGY DATABASE =====
    technology: {
        terms: [
            'تقنية', 'تكنولوجيا', 'ذكاء اصطناعي', 'AI', 'Machine Learning',
            'تعلم آلة', 'روبوت', 'robot', 'بلوكتشين', 'blockchain',
            'bitcoin', 'bitcoin', 'عملات رقمية', 'crypto',
            'برمجة', 'software', 'تطبيق', 'تطبيق', 'app',
            'هاتف', 'smartphone', 'iPhone', 'Samsung', 'Galaxy',
            'حاسوب', 'computer', 'laptop', 'tablet',
            'إنترنت', 'internet', '5G', '6G', 'واي فاي',
            'سيارة كهربائية', 'EV', 'Tesla', 'تسلا',
            'فضاء', 'space', 'NASA', 'ناسا', 'SpaceX',
            'الأقمار الصناعية', 'satellite', 'مسبار',
            'أمن سيبراني', 'cybersecurity', 'اختراق', 'هاكر',
            'بيانات', 'data', 'big data', 'تحليل البيانات',
            'metaverse', 'واقع افتراضي', 'VR', 'AR',
        ],
    },

    // ===== MAIN CLASSIFICATION FUNCTION =====
    classify(title, summary = '', sourceCategory = '') {
        const text = (title + ' ' + summary).toLowerCase();
        const scores = {};
        const entities = [];

        // Initialize scores
        for (const cat of Object.keys(this.categories)) {
            scores[cat] = 0;
        }

        // ===== SPORTS SCORING =====
        // Check players
        for (const [player, info] of Object.entries(this.sports.players)) {
            if (text.includes(player.toLowerCase())) {
                scores.sports += 10;
                entities.push({ type: 'player', name: player, ...info });
            }
        }

        // Check clubs
        for (const [club, info] of Object.entries(this.sports.clubs)) {
            if (text.includes(club.toLowerCase())) {
                scores.sports += 8;
                entities.push({ type: 'club', name: club, ...info });
            }
        }

        // Check national teams
        for (const team of Object.keys(this.sports.nationalTeams)) {
            if (text.includes(team.toLowerCase()) && (text.includes('منتخب') || text.includes('مباراة') || text.includes('كأس'))) {
                scores.sports += 7;
            }
        }

        // Check competitions
        for (const [comp, info] of Object.entries(this.sports.competitions)) {
            if (text.includes(comp.toLowerCase())) {
                scores.sports += 9;
                entities.push({ type: 'competition', name: comp, ...info });
            }
        }

        // Check sports terms
        for (const term of this.sports.terms) {
            if (text.includes(term.toLowerCase())) scores.sports += 2;
        }

        // Check other sports
        for (const sport of this.sports.otherSports) {
            if (text.includes(sport.toLowerCase())) scores.sports += 5;
        }

        // ===== ECONOMY SCORING =====
        for (const [company, info] of Object.entries(this.economy.companies)) {
            if (text.includes(company.toLowerCase())) {
                scores.economy += 8;
                entities.push({ type: 'company', name: company, ...info });
            }
        }

        for (const term of this.economy.terms) {
            if (text.includes(term.toLowerCase())) scores.economy += 2;
        }

        for (const term of this.economy.saudi) {
            if (text.includes(term.toLowerCase())) {
                scores.economy += 5;
                scores.local += 3;
            }
        }

        // ===== INTERNATIONAL SCORING =====
        for (const [country, keywords] of Object.entries(this.international.countries)) {
            for (const kw of keywords) {
                if (text.includes(kw.toLowerCase())) {
                    scores.international += 3;
                    entities.push({ type: 'country', name: country });
                    break;
                }
            }
        }

        for (const leader of Object.keys(this.international.leaders)) {
            if (text.includes(leader.toLowerCase())) {
                scores.international += 8;
                entities.push({ type: 'leader', name: leader, country: this.international.leaders[leader] });
            }
        }

        for (const org of this.international.organizations) {
            if (text.includes(org.toLowerCase())) scores.international += 6;
        }

        for (const event of this.international.events) {
            if (text.includes(event.toLowerCase())) scores.international += 3;
        }

        // ===== ENTERTAINMENT SCORING =====
        for (const term of this.entertainment.terms) {
            if (text.includes(term.toLowerCase())) scores.entertainment += 2;
        }

        for (const celeb of this.entertainment.celebrities) {
            if (text.includes(celeb.toLowerCase())) scores.entertainment += 8;
        }

        // ===== TOURISM SCORING =====
        for (const term of this.tourism.terms) {
            if (text.includes(term.toLowerCase())) scores.tourism += 2;
        }

        // ===== HEALTH SCORING =====
        for (const term of this.health.terms) {
            if (text.includes(term.toLowerCase())) scores.health += 2;
        }

        // ===== TECHNOLOGY SCORING =====
        for (const term of this.technology.terms) {
            if (text.includes(term.toLowerCase())) scores.technology += 2;
        }

        // ===== LOCAL (SAUDI) SCORING =====
        const saudiKeywords = [
            'السعودية', 'المملكة', 'الرياض', 'جدة', 'مكة', 'المدينة',
            'الدمام', 'الخبر', 'أبها', 'الباحة', 'نجران', 'جازان',
            'القصيم', 'حائل', 'تبوك', 'الجوف', 'عرعر',
            'سمو ولي العهد', 'الملك سلمان', 'رؤية 2030',
            'مجلس الوزراء', 'وزارة', 'أمير', 'محافظ',
            'الحرس الوطني', 'الدفاع', 'الداخلية', 'الخارجية',
            'هيئة', 'الشؤون الإسلامية', 'المرور', 'الأمن',
            'المقيمين', 'الإقامة', 'الحدود', 'التأشيرة',
        ];
        for (const kw of saudiKeywords) {
            if (text.includes(kw.toLowerCase())) scores.local += 3;
        }

        // ===== WORLD CUP SCORING =====
        const worldcupKeywords = ['كأس العالم', 'مونديال', ' fifa', 'world cup', '2026', '2030'];
        for (const kw of worldcupKeywords) {
            if (text.includes(kw.toLowerCase())) scores.worldcup += 5;
        }

        // ===== JOBS SCORING =====
        const jobKeywords = ['وظيفة', 'توظيف', 'توظيف', 'راتب', 'مسمى وظيفي', 'فرصة عمل', 'job', 'career', 'hiring'];
        for (const kw of jobKeywords) {
            if (text.includes(kw.toLowerCase())) scores.jobs += 5;
        }

        // ===== BOOST SOURCE CATEGORY =====
        if (sourceCategory && sourceCategory !== 'auto' && scores[sourceCategory] !== undefined) {
            scores[sourceCategory] += 5;
        }

        // ===== FIND BEST CATEGORY =====
        let bestCategory = 'local';
        let bestScore = 0;

        for (const [cat, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestCategory = cat;
            }
        }

        // ===== SUBCATEGORIES =====
        let subcategory = '';
        if (bestCategory === 'sports') {
            if (text.includes('كرة قدم') || text.includes('goal') || text.includes('مباراة')) subcategory = 'كرة قدم';
            else if (text.includes('فورمولا') || text.includes('F1')) subcategory = 'فورمولا 1';
            else if (text.includes('تنس')) subcategory = 'تنس';
            else if (text.includes('كرة سلة') || text.includes('NBA')) subcategory = 'كرة سلة';
            else subcategory = 'رياضة عامة';
        } else if (bestCategory === 'economy') {
            if (text.includes('نفط') || text.includes('أوبك') || text.includes('بترول')) subcategory = 'نفط وطاقة';
            else if (text.includes('أسهم') || text.includes('بورصة') || text.includes('تداول')) subcategory = 'أسواق المال';
            else if (text.includes('عملة') || text.includes('bitcoin') || text.includes('crypto')) subcategory = 'عملات';
            else if (text.includes('عقارات') || text.includes('تطوير')) subcategory = 'عقارات';
            else subcategory = 'اقتصاد عام';
        } else if (bestCategory === 'international') {
            // Find most mentioned country
            let topCountry = '';
            let topCount = 0;
            for (const [country, keywords] of Object.entries(this.international.countries)) {
                let count = 0;
                for (const kw of keywords) {
                    if (text.includes(kw.toLowerCase())) count++;
                }
                if (count > topCount) { topCount = count; topCountry = country; }
            }
            subcategory = topCountry || 'شؤون دولية';
        }

        // ===== CONFIDENCE SCORE =====
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const confidence = totalScore > 0 ? Math.min(Math.round((bestScore / totalScore) * 100), 100) : 0;

        return {
            category: bestCategory,
            categoryName: this.categories[bestCategory]?.name || bestCategory,
            categoryIcon: this.categories[bestCategory]?.icon || '📰',
            categorySlug: this.categories[bestCategory]?.slug || bestCategory,
            subcategory,
            confidence,
            entities,
            scores,
        };
    },

    // ===== BULK CLASSIFY =====
    classifyBatch(articles) {
        return articles.map(article => {
            const result = this.classify(article.title, article.summary || article.description || '', article.category || '');
            return {
                ...article,
                category: result.categorySlug,
                categoryName: result.categoryName,
                categoryIcon: result.categoryIcon,
                subcategory: result.subcategory,
                confidence: result.confidence,
                entities: result.entities,
            };
        });
    },
};

// Export for browser
if (typeof window !== 'undefined') {
    window.SmartCategorizer = SmartCategorizer;
}
