import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, X, Save, Trash2, BrainCircuit, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileModalProps {
  profile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onClear: () => void;
  onClose: () => void;
}

const FIELDS: {
  key: keyof Omit<UserProfile, 'updatedAt'>;
  label: string;
  icon: string;
  placeholder: string;
  hint: string;
}[] = [
  {
    key: 'personality',
    label: '性格特征',
    icon: '🧬',
    placeholder: '例如：偏内向、理性主导、完美主义、容易纠结、MBTI 为 INFJ…',
    hint: '让天平更懂你的思维偏好与情绪模式',
  },
  {
    key: 'work',
    label: '工作情况',
    icon: '💼',
    placeholder: '例如：互联网产品经理 3 年，当前项目高压、有晋升机会…',
    hint: '职业、行业、在职状态、工作压力等',
  },
  {
    key: 'study',
    label: '学习情况',
    icon: '📚',
    placeholder: '例如：在职备考考研，每天只有 2 小时学习时间…',
    hint: '在读、备考、技能学习等',
  },
  {
    key: 'life',
    label: '生活情况',
    icon: '🏡',
    placeholder: '例如：单身租房，月薪 1.5w，有 8w 存款，最近体检正常…',
    hint: '家庭、居住、经济状况、健康等',
  },
  {
    key: 'currentState',
    label: '当下状态',
    icon: '⚡',
    placeholder: '例如：近期焦虑失眠，精力一般，面临 30 岁职业分岔口…',
    hint: '近期情绪、精力、时间、紧要事项',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ profile, onSave, onClear, onClose }) => {
  const [form, setForm] = useState<UserProfile>({
    personality: profile?.personality || '',
    work: profile?.work || '',
    study: profile?.study || '',
    life: profile?.life || '',
    currentState: profile?.currentState || '',
  });

  const filledCount = FIELDS.filter((f) => form[f.key].trim()).length;

  const handleSave = () => {
    onSave({ ...form, updatedAt: Date.now() });
    onClose();
  };

  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">我的用户画像</h3>
              <p className="text-xs text-slate-400">
                填写你的基本场景，天平推演时 LLM 将结合画像给出量身定制的决策依据
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation strip */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4" /> 画像如何生效？
          </div>
          <p>
            保存后，每次发起天平推演，你的性格/工作/学习/生活/当下状态会作为参数随议题一起发送给
            DeepSeek，裁决官将直接引用这些信息给出针对性建议（仅存于本机浏览器，不上传服务器存储）。
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>{field.icon}</span>
                <span>{field.label}</span>
                <span className="text-[10px] font-normal text-slate-500">· {field.hint}</span>
              </label>
              <textarea
                value={form[field.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                rows={2}
                placeholder={field.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all resize-none"
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {filledCount > 0 ? (
              <span>
                已填写 <span className="text-cyan-300 font-bold">{filledCount}/5</span> 项
                {profile?.updatedAt && (
                  <span className="text-slate-500">
                    {' '}· 更新于 {new Date(profile.updatedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </span>
            ) : (
              <span>尚未填写画像，将使用通用裁决</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(profile || filledCount > 0) && (
              <button
                onClick={handleClear}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-slate-300 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> 清空画像
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-lg shadow-cyan-900/30 flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" /> 保存画像
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
