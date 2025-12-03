import React, {useState, useEffect, useMemo} from "react";
import {useParams, useNavigate} from 'react-router-dom';
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
    ArrowLeft, PlayCircle, Clock,
    BookOpen, Lock,
    CheckCircle,
    ChevronRight
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Skeleton} from "@/components/ui/skeleton";
import {api} from '@/api';
import {Course, Chapter, Lesson} from '@/types';

// 所有类型定义已移至 @/types

const CourseDetailPage: React.FC = () => {
    const {courseId} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [courseDetail, setcourseDetail] = useState<Course | null>(null);
    const [activeTab, setActiveTab] = useState<"intro" | "curriculum">("intro");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // 设置默认tab为课程目录
    const defaultTab: "intro" | "curriculum" = useMemo(() => {
        return "curriculum";
    }, []);

    // 添加响应式布局检测
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 获取课程详情
    useEffect(() => {
        const fetchCourseDetail = async () => {
            setLoading(true);
            try {
                const response = await api.getCourseDetail(courseId || '');
                setcourseDetail(response);
            } catch (error) {
                console.error("Failed to fetch course detail:", error);
            } finally {
                setLoading(false);
            }
        };
        if (courseId) {
            fetchCourseDetail();
        }
    }, [courseId]);

    // 当课程数据加载完成时，设置默认tab
    useEffect(() => {
        if (courseDetail && !loading) {
            setActiveTab(defaultTab);
        }
    }, [courseDetail, loading, defaultTab]);

    // 加载状态
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* 顶部导航骨架屏 */}
                <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
                    <div className="flex items-center justify-between px-4 h-14">
                        <Skeleton className="w-10 h-10 rounded-full bg-gray-200"/>
                        <Skeleton className="w-24 h-8 rounded-full bg-gray-200"/>
                    </div>
                </div>

                {/* 内容骨架屏 - 响应式布局 */}
                <div className="pt-14">
                    <div className="lg:container lg:mx-auto lg:pt-8 lg:px-4">
                        <div className="lg:flex lg:gap-8">
                            {/* 左侧内容骨架屏 */}
                            <div className="lg:w-2/3">
                                <Skeleton className="w-full aspect-video bg-gray-200"/>
                                <div className="p-4 space-y-4">
                                    <Skeleton className="h-8 w-3/4 bg-gray-200"/>
                                    <Skeleton className="h-4 w-1/2 bg-gray-200"/>
                                    <div className="flex gap-2">
                                        <Skeleton className="h-6 w-20 rounded-full bg-gray-200"/>
                                        <Skeleton className="h-6 w-20 rounded-full bg-gray-200"/>
                                    </div>
                                </div>
                            </div>

                            {/* 右侧内容骨架屏 - 仅在桌面显示 */}
                            <div className="hidden lg:block lg:w-1/3">
                                <div className="p-4 space-y-4">
                                    <Skeleton className="h-8 w-full bg-gray-200"/>
                                    <Skeleton className="h-32 w-full bg-gray-200"/>
                                    <Skeleton className="h-32 w-full bg-gray-200"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!courseDetail) return null;

    // 封面图组件 - 使用memo避免重新渲染
    const CourseCover = React.memo(() => (
        <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500">
            {courseDetail.coverImageUrl && (
                <img
                    src={courseDetail.coverImageUrl}
                    alt={courseDetail.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                />
            )}
            {/* 右上角购买状态标签 */}
            <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="w-16 h-16 text-white/90"/>
            </div>
        </div>
    ));

    // 移动端布局
    const MobileLayout = () => (
        <div className="min-h-full bg-gray-50">
            {/* 顶部导航栏 - 固定定位 */}
            <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
                <div className="flex items-center justify-between px-4 h-14">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="w-5 h-5"/>
                    </Button>
                </div>
            </div>

            {/* 主要内容区域 - 添加顶部边距 */}
            <div className="pt-14">
                {/* 课程封面 */}
                <CourseCover/>

                {/* 课程基本信息 */}
                <div className="px-4 py-4 bg-white border-b">
                    <h1 className="text-xl font-bold mb-2">{courseDetail.title}</h1>
                    <p className="text-gray-600 mb-3">{courseDetail.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4"/>
                            {courseDetail.totalChapters} 章 · {courseDetail.totalLessons} 课时
                        </div>
                        <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4"/>
                            {courseDetail.totalDuration} 分钟
                        </div>
                    </div>
                </div>

                {/* 试用引导卡片 - 仅在未购买时显示 */}

                {/* 内容标签页 */}
                <div className="border-b bg-white">
                    <div className="flex">
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-1 rounded-none border-b-2 border-transparent",
                                activeTab === 'intro' && "border-blue-600 text-blue-600"
                            )}
                            onClick={() => setActiveTab('intro')}
                        >
                            课程介绍
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-1 rounded-none border-b-2 border-transparent",
                                activeTab === 'curriculum' && "border-blue-600 text-blue-600"
                            )}
                            onClick={() => setActiveTab('curriculum')}
                        >
                            课程目录
                        </Button>
                    </div>
                </div>

                {/* 标签页内容 */}
                <div className="pb-20">
                    {activeTab === 'intro' ? (
                        <div className="p-4 space-y-6">

                            {/* 学习收获 */}
                            <Card>
                                <div className="p-4">
                                    <h2 className="text-lg font-bold mb-4">学习收获</h2>
                                    <div className="space-y-3">
                                        {courseDetail.whatYouWillLearn?.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-500"/>
                                                <span className="text-sm">{item}</span>
                                            </div>
                                        )) || []}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {/* 课程目录内容 */}
                            {courseDetail.chapters.map((chapter) => (
                                <ChapterCard
                                    key={chapter.uuid}
                                    chapter={chapter}
                                    enableSequentialLearning={courseDetail.sequentialLearn}
                                    allChapters={courseDetail.chapters}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 底部购买栏 - 仅在未购买时显示 */}
        </div>
    );

    // PC 端布局
    const DesktopLayout = () => (
        <div className="min-h-full bg-gray-50">
            {/* 顶部导航栏 */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="flex items-center h-16">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full mr-4"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-5 h-5"/>
                        </Button>
                        <h1 className="text-xl font-bold">{courseDetail.title}</h1>
                    </div>
                </div>
            </div>

            {/* 主要内容区域 */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* 左侧内容 */}
                    <div className="lg:w-2/3">
                        {/* 课程封面 */}
                        <div
                            className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg overflow-hidden mb-6">
                            {courseDetail.coverImageUrl && (
                                <img
                                    src={courseDetail.coverImageUrl}
                                    alt={courseDetail.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <PlayCircle className="w-20 h-20 text-white/90"/>
                            </div>
                        </div>

                        {/* 课程基本信息 */}
                        <div className="bg-white rounded-lg p-6 mb-6">
                            <h1 className="text-2xl font-bold mb-4">{courseDetail.title}</h1>
                            <p className="text-gray-600 mb-4">{courseDetail.description}</p>

                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4"/>
                                    {courseDetail.totalChapters} 章 · {courseDetail.totalLessons} 课时
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4"/>
                                    {courseDetail.totalDuration} 分钟
                                </div>
                            </div>


                            {/* 学习收获 */}
                            <div>
                                <h2 className="text-xl font-bold mb-4">学习收获</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {courseDetail.whatYouWillLearn?.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0"/>
                                            <span>{item}</span>
                                        </div>
                                    )) || []}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧内容 */}
                    <div className="lg:w-1/3">

                        {/* 课程目录 */}
                        <div className="bg-white rounded-lg p-6">
                            <h2 className="text-xl font-bold mb-4">课程目录</h2>
                            <div className="space-y-4">
                                {courseDetail.chapters.map((chapter) => (
                                    <ChapterCard
                                        key={chapter.uuid}
                                        chapter={chapter}
                                        enableSequentialLearning={courseDetail.sequentialLearn}
                                        allChapters={courseDetail.chapters}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return isMobile ? <MobileLayout/> : <DesktopLayout/>;
};

// 章节卡片组件
const ChapterCard: React.FC<{
    chapter: Chapter;
    enableSequentialLearning?: boolean; // 新增：是否启用顺序学习
    allChapters?: Chapter[]; // 新增：所有章节数据，用于判断前置条件
}> = ({chapter, enableSequentialLearning = false, allChapters = []}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // 计算章节完成进度
    const completedLessons = chapter.lessons.filter(lesson => lesson.isCompleted).length;
    const progress = chapter.lessons.length > 0
        ? Math.round((completedLessons / chapter.lessons.length) * 100)
        : 0;

    // 判断课程是否应该被锁定（基于顺序学习规则）
    const isLessonSequentiallyLocked = (lesson: Lesson, currentChapter: Chapter): boolean => {
        console.log('Checking lock for lesson:', lesson.title);
        if (enableSequentialLearning) {

            // 如果已经完成，不受限制
            if (lesson.isCompleted) return false;

            // 检查当前章节之前的所有章节是否都已完成
            const currentChapterIndex = allChapters.findIndex(ch => ch.uuid === currentChapter.uuid);
            if (currentChapterIndex === -1) return false;

            // 检查前面所有章节是否都已完成
            for (let i = 0; i < currentChapterIndex; i++) {
                const prevChapter = allChapters[i];
                const lessonsInPrevChapter = prevChapter.lessons || [];
                for (let lesson of lessonsInPrevChapter) {
                    if (!lesson.isCompleted) {
                        return true;
                    }
                }
            }

            // 检查当前章节内前面的课程是否都已完成
            const currentLessonIndex = currentChapter.lessons.findIndex(l => l.uuid === lesson.uuid);
            if (currentLessonIndex === -1) return false;

            for (let i = 0; i < currentLessonIndex; i++) {
                const prevLesson = currentChapter.lessons[i];
                if (!prevLesson.isCompleted) {
                    return true; // 前面有非免费课程未完成，锁定当前课程
                }
            }

            return false;
        } else {
            // 非顺序学习：禁止点击未学习的课程
            return !lesson.isCompleted && !lesson.isFree;
        }
    };

    const checkLessonLock = (lesson: Lesson, chapter: Chapter): boolean => {
        return isLessonSequentiallyLocked(lesson, chapter);
    }


    const handleLessonClick = (lesson: Lesson, chapter: Chapter) => {
        // 检查是否因为顺序学习规则被锁定
        const isSequentiallyLocked = isLessonSequentiallyLocked(lesson, chapter);

        if (isSequentiallyLocked) {
            // 如果课程被锁定，显示提示
            alert('请先完成前面的课程才能学习此课程');
            return;
        }


        // 使用 window.location 进行跳转
        window.location.href = `/course/learn?courseUuid=${chapter.courseUuid}&chapterUuid=${chapter.uuid}&lessonUuid=${lesson.uuid}`;
    };

    return (
        <Card className="overflow-hidden">
            {/* 章节标题栏 */}
            <div
                className={cn(
                    "p-4 bg-gray-50 cursor-pointer select-none",
                    "flex items-center justify-between"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold">{chapter.title}</h3>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        <span>{chapter.lessons.length} 课时</span>
                        <span className="mx-2">·</span>
                        {/* <span>{chapter.lessons.reduce((acc, curr) => acc + curr.duration, 0)}分钟</span>
            <span className="mx-2">·</span> */}
                        <span>{chapter.description}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                        {progress}%
                    </div>
                    <ChevronRight className={cn(
                        "w-5 h-5 text-gray-400 transition-transform",
                        isExpanded && "rotate-90"
                    )}/>
                </div>
            </div>

            {/* 课程列表 */}
            {isExpanded && (
                <div className="divide-y">
                    {chapter.lessons.map((lesson) => (
                        <div
                            key={lesson.uuid}
                            className={cn(
                                "p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            )}
                            onClick={() => handleLessonClick(lesson, chapter)}
                        >
                            <div className="flex items-center gap-3">
                                {/* 课程状态图标 */}
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    lesson.isCompleted ? "bg-green-100" : "bg-blue-100"
                                )}>
                                    {lesson.isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-600"/>
                                    ) : checkLessonLock(lesson, chapter) ? (
                                        <Lock className="w-4 h-4 text-gray-400"/>
                                    ) : (
                                        <BookOpen className="w-4 h-4 text-blue-600"/>
                                    )}
                                </div>

                                {/* 课程信息 */}
                                <div className={cn(
                                    "flex-1 min-w-0",
                                    checkLessonLock(lesson, chapter) && "opacity-60"
                                )}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{lesson.title}</span>
                                        {lesson.isFree && !lesson.isCompleted && (
                                            <Badge variant="default"
                                                   className="text-[10px] bg-green-500 hover:bg-green-600 text-white">
                                                免费
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3"/>
                        {lesson.duration}分钟
                    </span>
                                        {lesson.isCompleted && (
                                            <Badge variant="outline" className="text-[10px]">
                                                已完成
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* 右侧操作区 */}
                                <div className="flex items-center gap-2">
                                    {lesson.isLocked ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400"
                                            disabled
                                        >
                                            <Lock className="w-4 h-4"/>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600"
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件冒泡
                                                handleLessonClick(lesson, chapter);
                                            }}
                                        >
                                            {lesson.isCompleted ? (
                                                <CheckCircle className="w-4 h-4"/>
                                            ) : (
                                                <PlayCircle className="w-4 h-4"/>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default CourseDetailPage; 