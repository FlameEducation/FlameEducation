import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {cn} from '@/lib/utils';
import request from '@/utils/request';
import {getTeacherInfo} from '@/api/teacher';

interface TeacherInfo {
    uuid: string;
    teacherName: string;
    avatarUrl: string;
    description: string;
    personality: string;
    voiceProvider: string;
    voiceModel: string;
    emotionConfig: any;
}

interface RealTeacherAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    mood?: 'happy' | 'thinking' | 'teaching' | 'listening';
    speaking?: boolean;
    teacherUuid?: string;
    teacherInfo?: TeacherInfo; // 新增：直接传入教师信息
    className?: string;
}

// 默认教师配置信息 - 作为后备方案
const defaultTeacherProfiles = {
    'teacher-1': {
        name: '萱萱老师',
        avatar: '/images/teacher-cheng.png',
        specialty: 'Python基础',
        style: '温柔耐心',
    },
    'teacher-2': {
        name: '姜老师',
        avatar: '/images/teacher-wang.png',
        specialty: '算法进阶',
        style: '幽默风趣',
    },
    'teacher-3': {
        name: '雅雅老师',
        avatar: '/images/teacher-yaya.png',
        specialty: '项目实战',
        style: '严谨专业',
    },
};

const RealTeacherAvatar: React.FC<RealTeacherAvatarProps> = ({
                                                                 size = 'md',
                                                                 mood = 'happy',
                                                                 speaking = false,
                                                                 teacherUuid = 'teacher-1',
                                                                 teacherInfo,
                                                                 className
                                                             }) => {
    const [currentTeacher, setCurrentTeacher] = useState<any>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [loading, setLoading] = useState(false);

    // 获取教师信息
    const fetchTeacherInfo = async (uuid: string) => {
        try {
            setLoading(true);
            const response = await getTeacherInfo(uuid);
            if (response) {
                setCurrentTeacher({
                    name: response.teacherName,
                    avatar: response.avatarUrl || '/images/default-teacher.png',
                    specialty: response.description || '专业教师',
                    style: response.personality || '亲切友好',
                    voiceProvider: response.voiceProvider,
                    voiceModel: response.voiceModel,
                    emotionConfig: response.emotionConfig
                });
            } else {
                // 使用默认配置
                setCurrentTeacher(defaultTeacherProfiles[teacherUuid as keyof typeof defaultTeacherProfiles] || defaultTeacherProfiles['teacher-1']);
            }
        } catch (error) {
            console.error('获取教师信息失败:', error);
            // 使用默认配置作为后备方案
            setCurrentTeacher(defaultTeacherProfiles[teacherUuid as keyof typeof defaultTeacherProfiles] || defaultTeacherProfiles['teacher-1']);
        } finally {
            setLoading(false);
        }
    };

    // 监听teacherUuid和teacherInfo变化，更新当前教师
    useEffect(() => {
        console.log('教师ID或信息变化:', teacherUuid, teacherInfo);
        if (teacherInfo) {
            // 如果直接传入了教师信息，则使用传入的信息
            console.log('使用传入的教师信息:', teacherInfo);
            setCurrentTeacher({
                name: teacherInfo.teacherName,
                avatar: teacherInfo.avatarUrl || '/images/default-teacher.png',
                specialty: teacherInfo.description || '专业教师',
                style: teacherInfo.personality || '亲切友好',
                voiceProvider: teacherInfo.voiceProvider,
                voiceModel: teacherInfo.voiceModel,
                emotionConfig: teacherInfo.emotionConfig
            });
            setImageLoaded(false);
        } else if (teacherUuid && teacherUuid.startsWith('teacher-')) {
            // 如果是旧的teacherUuid格式，使用默认配置
            const teacher = defaultTeacherProfiles[teacherUuid as keyof typeof defaultTeacherProfiles] || defaultTeacherProfiles['teacher-1'];
            setCurrentTeacher(teacher);
            setImageLoaded(false);
        } else if (teacherUuid) {
            // 如果是UUID格式，从服务器获取教师信息
            fetchTeacherInfo(teacherUuid);
            setImageLoaded(false);
        } else {
            // 默认使用第一个教师
            setCurrentTeacher(defaultTeacherProfiles['teacher-1']);
            setImageLoaded(false);
        }
    }, [teacherUuid, teacherInfo]);

    // 尺寸映射
    const sizeMap = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-56 h-56'
    };

    // 状态指示器样式
    const moodIndicators = {
        happy: 'bg-green-400',
        thinking: 'bg-yellow-400',
        teaching: 'bg-blue-400',
        listening: 'bg-purple-400'
    };

    // 如果没有教师信息或正在加载，显示加载状态
    if (!currentTeacher || loading) {
        return (
            <div
                className={cn(
                    "relative flex items-center justify-center bg-gray-100 rounded-full",
                    sizeMap[size],
                    className
                )}
            >
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
            </div>
        );
    }

    return (
        <motion.div
            className={cn(
                "relative",
                sizeMap[size],
                className
            )}
            animate={{
                scale: speaking ? [1, 1.02, 1] : 1,
            }}
            transition={{
                repeat: speaking ? Infinity : 0,
                duration: 2,
                ease: "easeInOut"
            }}
        >
            {/* 简约声波 (Minimalist Sound Wave) 动画 */}
            <AnimatePresence>
                {speaking ? (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                    >
                        {/* 左侧 */}
                        <motion.div
                            className="absolute -left-3 w-1.5 bg-blue-400 rounded-full"
                            style={{top: '50%', y: '-50%'}}
                            animate={{height: ['12px', '24px', '12px']}}
                            transition={{duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0}}
                        />
                        <motion.div
                            className="absolute -left-6 w-1.5 bg-blue-400 rounded-full"
                            style={{top: '50%', y: '-50%'}}
                            animate={{height: ['16px', '32px', '16px']}}
                            transition={{duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15}}
                        />

                        {/* 右侧 */}
                        <motion.div
                            className="absolute -right-6 w-1.5 bg-blue-400 rounded-full"
                            style={{top: '50%', y: '-50%'}}
                            animate={{height: ['16px', '32px', '16px']}}
                            transition={{duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15}}
                        />
                        <motion.div
                            className="absolute -right-3 w-1.5 bg-blue-400 rounded-full"
                            style={{top: '50%', y: '-50%'}}
                            animate={{height: ['12px', '24px', '12px']}}
                            transition={{duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0}}
                        />
                    </motion.div>
                ) : (
                    /* 非说话状态下的静态背景光晕 */
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                            opacity: 0.3,
                        }}
                    >
                        <div className={cn(
                            "w-full h-full rounded-full blur-xl",
                            moodIndicators[mood],
                            "opacity-30"
                        )}/>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 主要头像容器 */}
            <div className="relative w-full h-full rounded-full overflow-hidden bg-gray-100 shadow-lg">
                {/* 加载状态 */}
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div
                            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"/>
                    </div>
                )}

                {/* 真人头像 */}
                <img
                    src={currentTeacher.avatar}
                    alt={currentTeacher.name}
                    className={cn(
                        "w-full h-full object-cover",
                        !imageLoaded && "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                        // 加载失败时使用默认头像
                        console.error('教师头像加载失败');
                    }}
                />

                {/* 说话时的动画遮罩 */}
                <AnimatePresence>
                    {speaking && (
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="absolute inset-0 pointer-events-none"
                        >
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/20 to-transparent"
                                animate={{
                                    height: ['33%', '40%', '33%'],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                    ease: "easeInOut"
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 状态指示器 */}
                <div className="absolute bottom-2 right-2">
                    <motion.div
                        className={cn(
                            "w-3 h-3 rounded-full",
                            moodIndicators[mood]
                        )}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.8, 1, 0.8]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                        }}
                    />
                </div>
            </div>

            {/* 教师信息标签 - 仅在大尺寸时显示 */}
            {size === 'lg' && (
                <motion.div
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm
                     rounded-full px-4 py-1 shadow-md whitespace-nowrap"
                >
                    <p className="text-sm font-medium">{currentTeacher.name}</p>
                    <p className="text-xs text-gray-500">{currentTeacher.style}</p>
                </motion.div>
            )}

            {/* 语音波纹效果 - 已被 Siri Chaos 动画替代，此处移除旧代码 */}
        </motion.div>
    );
};

export default RealTeacherAvatar;