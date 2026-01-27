import { useState } from "react";
import {
  Trophy,
  Zap,
  Star,
  Play,
  CheckCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Award,
  Flame,
  BookOpen,
  Sparkles,
  PartyPopper,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import {
  useTraining,
  type TrainingModule,
  type TrainingLesson,
  type Achievement,
} from "../../contexts/TrainingContext";

// ============================================
// XP & LEVEL CALCULATIONS
// ============================================

const XP_PER_LEVEL = 200;

const calculateLevel = (xp: number) => {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = xp % XP_PER_LEVEL;
  const progress = (currentLevelXp / XP_PER_LEVEL) * 100;
  const xpToNext = XP_PER_LEVEL - currentLevelXp;
  return { level, progress, xpToNext, currentLevelXp };
};

// ============================================
// COMPONENTS
// ============================================

// Stats Card
function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg transform transition-all hover:scale-[1.02] hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="bg-white/20 rounded-xl p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Level Progress Card
function LevelProgressCard({
  level,
  xpPoints,
  progress,
  xpToNext,
}: {
  level: number;
  xpPoints: number;
  progress: number;
  xpToNext: number;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-4 text-white shadow-lg">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">
              Level {level} Progress
            </h3>
            <p className="text-sm text-gray-500">
              {xpToNext} XP needed for Level {level + 1}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {xpPoints}
          </span>
          <span className="text-gray-400 ml-1">XP</span>
        </div>
      </div>
      <div className="relative">
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Level {level}</span>
          <span>{Math.round(progress)}%</span>
          <span>Level {level + 1}</span>
        </div>
      </div>
    </div>
  );
}

// Module Card
function ModuleCard({
  module,
  progress,
  isCompleted,
  isExpanded,
  onToggle,
  onStartLesson,
  isLessonCompleted,
}: {
  module: TrainingModule;
  progress: number;
  isCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onStartLesson: (lessonId: string) => void;
  isLessonCompleted: (lessonId: string) => boolean;
}) {
  const difficultyColors = {
    beginner: "bg-emerald-100 text-emerald-700",
    intermediate: "bg-amber-100 text-amber-700",
    advanced: "bg-red-100 text-red-700",
  };

  const completedLessons = module.lessons.filter((l) =>
    isLessonCompleted(l.id),
  ).length;

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        isCompleted
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-gray-200 bg-white hover:border-violet-200"
      }`}
    >
      {/* Module Header */}
      <div
        onClick={onToggle}
        className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Emoji Icon */}
          <div
            className={`bg-gradient-to-br ${module.color} rounded-2xl p-4 text-2xl shadow-lg flex-shrink-0`}
          >
            {module.emoji}
          </div>

          {/* Module Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold text-violet-600">
                MODULE {module.number}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[module.difficulty]}`}
              >
                {module.difficulty.charAt(0).toUpperCase() +
                  module.difficulty.slice(1)}
              </span>
              {isCompleted && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{module.title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {module.description}
            </p>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {module.estimatedTime}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {module.lessons.length} lessons
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5" />
                {module.lessons.length * 50} XP
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  {completedLessons}/{module.lessons.length} lessons
                </span>
                <span className="font-semibold text-violet-600">
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-violet-500 to-purple-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expand Icon */}
          <div className="flex-shrink-0 text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Lessons List */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-2">
          {module.lessons.map((lesson, idx) => {
            const completed = isLessonCompleted(lesson.id);
            return (
              <div
                key={lesson.id}
                onClick={() => !completed && onStartLesson(lesson.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  completed
                    ? "bg-emerald-100/50 cursor-default"
                    : "bg-white hover:bg-violet-50 hover:shadow-sm"
                }`}
              >
                {/* Lesson Number/Check */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    completed
                      ? "bg-emerald-500 text-white"
                      : "bg-violet-100 text-violet-600"
                  }`}
                >
                  {completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <h4
                    className={`font-medium text-sm ${completed ? "text-emerald-700" : "text-gray-900"}`}
                  >
                    {lesson.emoji} {lesson.title}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    {lesson.description}
                  </p>
                </div>

                {/* Duration & Action */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {lesson.duration}
                  </span>
                  {!completed && (
                    <button className="p-1.5 bg-violet-100 text-violet-600 rounded-lg hover:bg-violet-200 transition-colors">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Achievement Card
function AchievementCard({
  achievement,
  isUnlocked,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border-2 text-center transition-all transform hover:scale-105 ${
        isUnlocked
          ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg"
          : "border-gray-200 bg-gray-50 opacity-60"
      }`}
    >
      <div className={`text-4xl mb-2 ${!isUnlocked && "grayscale opacity-50"}`}>
        {achievement.emoji}
      </div>
      <h4
        className={`font-bold text-sm ${isUnlocked ? "text-gray-900" : "text-gray-500"}`}
      >
        {achievement.title}
      </h4>
      <p className="text-xs text-gray-500 mt-1">
        {isUnlocked ? achievement.description : achievement.requirement}
      </p>
      {isUnlocked && (
        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-xs rounded-full">
          <Sparkles className="w-3 h-3" />
          Unlocked!
        </div>
      )}
    </div>
  );
}

// Training Spotlight Modal (Interactive Tutorial)
function TrainingSpotlight({
  module,
  lesson,
  stepIndex,
  onNext,
  onPrevious,
  onComplete,
  onExit,
}: {
  module: TrainingModule;
  lesson: TrainingLesson;
  stepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  const step = lesson.steps[stepIndex];
  const isLastStep = stepIndex === lesson.steps.length - 1;
  const isFirstStep = stepIndex === 0;
  const progress = ((stepIndex + 1) / lesson.steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onExit}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div
          className={`bg-gradient-to-r ${module.color} p-6 text-white relative`}
        >
          <button
            onClick={onExit}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{module.emoji}</span>
            <div>
              <p className="text-white/80 text-sm">{module.title}</p>
              <h3 className="font-bold text-lg">{lesson.title}</h3>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/80 mb-1">
              <span>
                Step {stepIndex + 1} of {lesson.steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h4>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>

          {step.celebration && (
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <PartyPopper className="w-8 h-8 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-800">
                  Congratulations! 🎉
                </p>
                <p className="text-sm text-amber-600">
                  You've earned 50 XP for completing this lesson!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex items-center justify-between">
          <button
            onClick={onPrevious}
            disabled={isFirstStep}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              isFirstStep
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          {isLastStep ? (
            <button
              onClick={onComplete}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Lesson
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick Start CTA
function QuickStartCTA({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-center text-white shadow-xl">
      <PartyPopper className="h-12 w-12 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2">Ready to Start Your Journey?</h3>
      <p className="text-white/90 mb-6 max-w-md mx-auto">
        Begin with "Getting Started" - it only takes 15 minutes to learn the
        basics!
      </p>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-600 rounded-xl font-semibold hover:bg-white/90 shadow-lg transition-all"
      >
        <Play className="h-5 w-5" />
        Start Learning Now!
      </button>
    </div>
  );
}

// ============================================
// MAIN TRAINING PAGE
// ============================================

export function TrainingPage() {
  const {
    progress,
    modules,
    achievements,
    getModuleProgress,
    isLessonCompleted,
    startTraining,
    isTrainingActive,
    currentModule,
    currentLesson,
    currentStepIndex,
    nextStep,
    previousStep,
    completeLesson,
    exitTraining,
    updateStreak,
  } = useTraining();

  const [expandedModule, setExpandedModule] = useState<string | null>(
    modules[0]?.id || null,
  );
  const [activeTab, setActiveTab] = useState<"modules" | "achievements">(
    "modules",
  );

  // Calculate stats
  const {
    level,
    progress: levelProgress,
    xpToNext,
  } = calculateLevel(progress.xpPoints);
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessonsCount = progress.completedLessons.length;
  const overallProgress =
    totalLessons > 0
      ? Math.round((completedLessonsCount / totalLessons) * 100)
      : 0;

  // Handle starting a lesson
  const handleStartLesson = (moduleId: string, lessonId: string) => {
    updateStreak(); // Update streak when user starts training
    startTraining(moduleId, lessonId);
  };

  // Handle completing a lesson
  const handleCompleteLesson = () => {
    completeLesson();
    exitTraining();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Center</h1>
        <p className="text-gray-500 mt-1">
          Master Warehouse POS step by step. Earn XP and unlock achievements!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Star}
          title="Your Level"
          value={`Level ${level}`}
          subtitle={`${xpToNext} XP to next`}
          gradient="from-indigo-500 to-purple-600"
        />
        <StatsCard
          icon={Zap}
          title="Total XP"
          value={progress.xpPoints}
          subtitle="Experience points"
          gradient="from-amber-500 to-orange-600"
        />
        <StatsCard
          icon={Flame}
          title="Streak"
          value={`${progress.streak} days`}
          subtitle="Keep it going!"
          gradient="from-red-500 to-pink-600"
        />
        <StatsCard
          icon={Trophy}
          title="Progress"
          value={`${completedLessonsCount}/${totalLessons}`}
          subtitle={`${overallProgress}% complete`}
          gradient="from-emerald-500 to-green-600"
        />
      </div>

      {/* Level Progress */}
      <LevelProgressCard
        level={level}
        xpPoints={progress.xpPoints}
        progress={levelProgress}
        xpToNext={xpToNext}
      />

      {/* Quick Start CTA (only if no lessons completed) */}
      {completedLessonsCount === 0 && (
        <QuickStartCTA
          onStart={() => handleStartLesson("module-1-1", "lesson-1-1-1")}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("modules")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "modules"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Training Modules
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            {modules.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "achievements"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Achievements
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs">
            {progress.achievements.length}/{achievements.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "modules" && (
        <div className="space-y-4">
          {modules.map((module) => {
            const moduleProgress = getModuleProgress(module.id);
            const isCompleted = moduleProgress === 100;
            const isExpanded = expandedModule === module.id;

            return (
              <ModuleCard
                key={module.id}
                module={module}
                progress={moduleProgress}
                isCompleted={isCompleted}
                isExpanded={isExpanded}
                onToggle={() =>
                  setExpandedModule(isExpanded ? null : module.id)
                }
                onStartLesson={(lessonId) =>
                  handleStartLesson(module.id, lessonId)
                }
                isLessonCompleted={isLessonCompleted}
              />
            );
          })}
        </div>
      )}

      {activeTab === "achievements" && (
        <div>
          {/* Achievement Stats */}
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-3 rounded-xl">
                  <Trophy className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    Achievement Progress
                  </h3>
                  <p className="text-sm text-gray-600">
                    {progress.achievements.length} of {achievements.length}{" "}
                    achievements unlocked
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-amber-600">
                  {Math.round(
                    (progress.achievements.length / achievements.length) * 100,
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${(progress.achievements.length / achievements.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={progress.achievements.includes(achievement.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Training Spotlight Modal */}
      {isTrainingActive && currentModule && currentLesson && (
        <TrainingSpotlight
          module={currentModule}
          lesson={currentLesson}
          stepIndex={currentStepIndex}
          onNext={nextStep}
          onPrevious={previousStep}
          onComplete={handleCompleteLesson}
          onExit={exitTraining}
        />
      )}
    </div>
  );
}

export default TrainingPage;
