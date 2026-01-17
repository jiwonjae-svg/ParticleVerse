'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Image,
  Type,
  Box,
  Sparkles,
  Hand,
  Palette,
  ChevronLeft,
  ChevronRight,
  Activity,
  Info,
  RotateCcw,
  Video,
  Cog,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales';
import SourcePanel from './panels/SourcePanel';
import EffectsPanel from './panels/EffectsPanel';
import ParticlePanel from './panels/ParticlePanel';
import VisualPanel from './panels/VisualPanel';
import HandPanel from './panels/HandPanel';
import SettingsPanel from './panels/SettingsPanel';
import RecordPanel from './panels/RecordPanel';

const tabs = [
  { id: 'source', labelKey: 'source', icon: Image },
  { id: 'effects', labelKey: 'effects', icon: Sparkles },
  { id: 'particles', labelKey: 'particlesTab', icon: Box },
  { id: 'visual', labelKey: 'visual', icon: Palette },
  { id: 'hand', labelKey: 'handControl', icon: Hand },
  { id: 'record', labelKey: 'record', icon: Video },
  { id: 'settings', labelKey: 'settingsTab', icon: Cog },
];

export default function UIOverlay() {
  const { 
    isPanelVisible, 
    togglePanel, 
    activeTab, 
    setActiveTab,
    fps,
    particleCount,
    currentGesture,
    reset,
    isLoading,
    error,
  } = useAppStore();

  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      {/* 상단 바 */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="ui-overlay top-0 left-0 right-0 p-4 flex justify-between items-center"
      >
        {/* 로고 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white dark:text-white light:text-slate-800">{t('appName')}</h1>
            <p className="text-xs text-dark-400 dark:text-dark-400 light:text-slate-500">{t('appDescription')}</p>
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="flex items-center gap-4">
          {/* 성능 모니터 */}
          <div className="glass px-3 py-1.5 rounded-lg flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-green-400 dark:text-green-400 light:text-emerald-500" />
              <span className="text-white dark:text-white light:text-slate-800 font-medium">{fps} {t('fps')}</span>
            </div>
            <div className="w-px h-4 bg-dark-600 dark:bg-dark-600 light:bg-slate-300/60" />
            <div className="text-dark-300 dark:text-dark-300 light:text-slate-600">
              {(particleCount / 1000).toFixed(0)}K {t('particles')}
            </div>
            {currentGesture !== 'none' && (
              <>
                <div className="w-px h-4 bg-dark-600 dark:bg-dark-600 light:bg-slate-300/60" />
                <div className="text-primary-400 dark:text-primary-400 light:text-primary-600">
                  {currentGesture}
                </div>
              </>
            )}
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="btn-icon glass"
              title={t('info')}
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={reset}
              className="btn-icon glass"
              title={t('reset')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePanel}
              className="btn-icon glass"
              title={isPanelVisible ? t('hidePanel') : t('showPanel')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 사이드 패널 */}
      <AnimatePresence>
        {isPanelVisible && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="ui-overlay left-0 top-20 bottom-4 w-80 ml-4"
          >
            <div className="panel h-full flex flex-col">
              {/* 탭 헤더 */}
              <div className="flex gap-0.5 mb-4 p-1 bg-dark-800/50 rounded-xl overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab flex flex-col items-center gap-1 py-2 px-1.5 min-w-[40px] ${
                        activeTab === tab.id ? 'active' : ''
                      }`}
                      title={t(tab.labelKey)}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[9px] leading-tight whitespace-nowrap">{t(tab.labelKey)}</span>
                    </button>
                  );
                })}
              </div>

              {/* 탭 콘텐츠 */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'source' && <SourcePanel />}
                    {activeTab === 'effects' && <EffectsPanel />}
                    {activeTab === 'particles' && <ParticlePanel />}
                    {activeTab === 'visual' && <VisualPanel />}
                    {activeTab === 'hand' && <HandPanel />}
                    {activeTab === 'settings' && <SettingsPanel />}
                    {activeTab === 'record' && <RecordPanel />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 패널 토글 버튼 (패널이 숨겨졌을 때) */}
      <AnimatePresence>
        {!isPanelVisible && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            onClick={togglePanel}
            className="ui-overlay left-4 top-1/2 -translate-y-1/2 glass p-2 rounded-lg hover:bg-dark-700"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 로딩 오버레이 */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="glass p-6 rounded-2xl flex flex-col items-center gap-4">
              <div className="spinner" />
              <p className="text-white text-sm">{t('loading')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="ui-overlay bottom-4 left-1/2 -translate-x-1/2"
          >
            <div className="bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-lg">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 정보 모달 */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-6 rounded-2xl max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">{t('infoTitle')}</h2>
              <div className="space-y-3 text-sm text-dark-300">
                <p>
                  <strong className="text-white">{t('infoImageUpload')}</strong> {t('infoImageUploadDesc')}
                </p>
                <p>
                  <strong className="text-white">{t('infoTextInput')}</strong> {t('infoTextInputDesc')}
                </p>
                <p>
                  <strong className="text-white">{t('infoHandControl')}</strong> {t('infoHandControlDesc')}
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>{t('openHand')}: {t('push')}</li>
                  <li>{t('fist')}: {t('pull')}</li>
                  <li>{t('pinch')}: {t('gather')}</li>
                </ul>
                <p>
                  <strong className="text-white">{t('infoMouseControl')}</strong> {t('infoMouseControlDesc')}
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="btn btn-primary w-full mt-6"
              >
                {t('close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
