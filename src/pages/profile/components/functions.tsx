import {Card} from "@/components/ui/card.tsx";
import {BookOpen, Calendar, ChevronRight, Clock, Crown, History, RefreshCcw, Trophy, Users} from "lucide-react";
import React from "react";
import {useNavigate} from "react-router-dom";
import ProfilePage from "@/pages/profile";


const Functions = () => {

  const navigate = useNavigate();

  return (
    <div className="flex-1 -mt-4 rounded-t-[2rem] bg-gray-50 overflow-hidden">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* 学习情况总览 */}
        <div className="space-y-3 hidden">
          <h2 className="text-base font-medium text-gray-800 px-1">学习情况总览</h2>
          <Card className="bg-gradient-to-br from-violet-500 via-violet-400 to-indigo-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"/>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"/>
            <div className="p-4 text-white relative">
              <div className="grid grid-cols-3 divide-x divide-white/20">
                {/* 今日学习 */}
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-white/80"/>
                    <span className="text-xs font-medium text-white/80 truncate">今日学习</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">45</span>
                    <span className="text-xs ml-1">分钟</span>
                  </div>
                </div>

                {/* 已完成课程 */}
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <BookOpen className="w-4 h-4 text-white/80"/>
                    <span className="text-xs font-medium text-white/80 truncate">完成课程</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">12</span>
                    <span className="text-xs ml-1">节</span>
                  </div>
                </div>

                {/* 获得徽章 */}
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Trophy className="w-4 h-4 text-white/80"/>
                    <span className="text-xs font-medium text-white/80 truncate">获得徽章</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xl font-bold">8</span>
                    <span className="text-xs ml-1">个</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 课程相关 */}
        <div className="space-y-3">
          <h2 className="text-base font-medium text-gray-800 px-1">课程相关</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* 我的课程 - 大卡片 */}
            <Card
              className="col-span-2 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-rose-400 to-pink-400 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"/>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"/>
              <div className="p-4 text-white relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-6 h-6"/>
                    <h3 className="font-medium">我的课程</h3>
                  </div>
                  <ChevronRight className="w-5 h-5"/>
                </div>
                <p className="text-sm text-white/80">2 个课程进行中</p>
              </div>
            </Card>

            {/* 学习历史 */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-teal-400 to-emerald-400 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"/>
              <div className="p-4 text-white relative">
                <div className="flex items-center gap-2 mb-2">
                  <History className="w-5 h-5"/>
                  <h3 className="font-medium">学习历史</h3>
                </div>
                <p className="text-sm text-white/80">本周已完成 3 节课</p>
              </div>
            </Card>

            {/* 课程规划 */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-amber-400 to-orange-400 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"/>
              <div className="p-4 text-white relative">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5"/>
                  <h3 className="font-medium">课程规划</h3>
                </div>
                <p className="text-sm text-white/80">有 1 个待完成任务</p>
              </div>
            </Card>
          </div>
        </div>

        {/* 知识管理 */}
        <div className="space-y-3">
          <h2 className="text-base font-medium text-gray-800 px-1">知识管理</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* 知识积累 */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
              onClick={() => navigate('/knowledge-base')}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"/>
              <div className="p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-cyan-500"/>
                  </div>
                  <h3 className="font-medium">知识积累</h3>
                </div>
                <p className="text-sm text-gray-500">已掌握 500+ 知识点</p>
              </div>
            </Card>

            {/* 错题回顾 */}
            <Card
              className="hover:shadow-md transition-all cursor-pointer relative overflow-hidden group"
              onClick={() => navigate('/mistake-review')}
            >
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100 to-red-100 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"/>
              <div className="p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <RefreshCcw className="w-5 h-5 text-rose-500"/>
                  </div>
                  <h3 className="font-medium">错题回顾</h3>
                </div>
                <p className="text-sm text-gray-500">10 道题待复习</p>
              </div>
            </Card>
          </div>
        </div>

        {/* 更多功能 */}
        <div className="space-y-3">
          <h2 className="text-base font-medium text-gray-800 px-1">更多功能</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* 成就徽章 */}
            <Card className="hover:shadow-md transition-all cursor-pointer relative overflow-hidden group">
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"/>
              <div className="p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-500"/>
                  </div>
                  <h3 className="font-medium">成就徽章</h3>
                </div>
                <p className="text-sm text-gray-500">新获得 2 个徽章</p>
              </div>
            </Card>

            {/* 学习圈 */}
            <Card className="hover:shadow-md transition-all cursor-pointer relative overflow-hidden group">
              <div
                className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-fuchsia-100 to-purple-100 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"/>
              <div className="p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-fuchsia-500"/>
                  </div>
                  <h3 className="font-medium">学习圈</h3>
                </div>
                <p className="text-sm text-gray-500">3 个好友在学习</p>
              </div>
            </Card>

            {/* 会员中心 */}
            <Card
              className="col-span-2 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group hidden"
              onClick={() => navigate('/membership')}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"/>
              <div className="p-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-500"/>
                    </div>
                    <div>
                      <h3 className="font-medium">会员中心</h3>
                      <p className="text-sm text-gray-500 mt-1">查看会员权益和交易记录</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400"/>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Functions;