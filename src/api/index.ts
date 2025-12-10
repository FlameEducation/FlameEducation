import * as lesson from "@/api/lesson.ts";
import * as chat from "@/api/chat.ts";
import * as session from "@/api/session.ts";
import * as course from "@/api/course.ts";
import * as exercise from "@/api/exercise.ts";
import * as blackboard from "@/api/blackboard.ts";
import * as auth from "@/api/auth.ts";
import * as image from "@/api/image.ts";
import * as reward from "@/api/reward.ts";
import * as teacher from "@/api/teacher.ts";
import * as mindmap from "@/api/mindmap.ts";
import * as promptConfig from "@/api/promptConfig.ts";

export const api = {
  ...lesson,
  ...chat,
  ...session,
  ...course,
  ...exercise,
  ...blackboard,
  ...auth,
  ...image,
  ...reward,
  ...teacher,
  ...promptConfig,
  ...mindmap,
};

export default api;