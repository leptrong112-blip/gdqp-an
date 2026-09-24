import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useAnimations, useGLTF, useProgress } from '@react-three/drei';
import { Group, LoopOnce, LoopRepeat, MathUtils } from 'three';
import { Users, Move, MapPin, Pause, Play, RotateCcw, CheckCircle2, Eye, Compass, Maximize2, Minimize2, BookOpen, ExternalLink } from 'lucide-react';
import TrainingGroundModel from './TrainingGroundModel';
import Soldier3D from './Soldier3D';
import TrainingCameraController from './TrainingCameraController';
import { SOLDIER_ANIMATIONS, type SoldierAnimationName } from './animationController';
import { OBSERVATION_POINTS, type CameraPreset, type GroundZone } from './trainingSceneConfig';
import { MOVEMENT_ROUTE_LENGTH, sampleMovementRoute, SQUAD_SPACING_METERS } from './trainingMotion';

type Category = 'doingu' | 'vandong' | 'diahinh' | 'laban';
type ActionItem = {
  id: string;
  name: string;
  description: string;
  animation?: SoldierAnimationName;
  zone?: GroundZone;
  camera?: CameraPreset;
  sgkBadge?: string;
  sgkDetail?: string;
};
type CategoryItem = {
  id: Category;
  title: string;
  icon: typeof Users;
  sgkBadge: string;
  sgkLesson: string;
  sgkSection: string;
  pdfFile: string;
  pdfLabel: string;
  actions: ActionItem[];
};

const CATEGORIES: CategoryItem[] = [
  {
    id: 'doingu',
    title: 'Đội ngũ',
    icon: Users,
    sgkBadge: 'SGK 10 · Bài 9',
    sgkLesson: 'Bài 9: Đội ngũ từng người không có súng',
    sgkSection: 'Mục I & II: Động tác Nghiêm, Nghỉ, Quay tại chỗ và Động tác Chào',
    pdfFile: '/books/gdqp10-kntt.pdf',
    pdfLabel: 'SGK GDQP-AN 10 (Kết nối tri thức)',
    actions: [
      {
        id: 'attention',
        name: 'Đứng nghiêm',
        animation: 'Attention',
        description: 'Quan sát tư thế thẳng, vai cân bằng, tay dọc thân và hướng nhìn phía trước.',
        sgkBadge: 'SGK 10 · Bài 9 (Mục I)',
        sgkDetail: 'Động tác Nghiêm: Hai gót chân sát nhau trên đường thẳng, mũi bàn chân mở 45°, ngực nở, bụng thót, mắt nhìn thẳng.',
      },
      {
        id: 'ease',
        name: 'Đứng nghỉ',
        animation: 'AtEase',
        description: 'Quan sát chuyển trọng tâm nhẹ, tư thế thư giãn và nhịp thở tự nhiên.',
        sgkBadge: 'SGK 10 · Bài 9 (Mục I)',
        sgkDetail: 'Động tác Nghỉ: Trùng gối chân trái (hoặc chân phải), trọng lượng toàn thân dồn vào chân trụ còn lại, thân trên vẫn giữ ngay ngắn.',
      },
      {
        id: 'salute',
        name: 'Chào',
        animation: 'Salute',
        description: 'Quan sát nhịp nâng tay phải, giữ tư thế chào rồi hạ tay về cạnh thân.',
        sgkBadge: 'SGK 10 · Bài 9 (Mục II)',
        sgkDetail: 'Động tác Chào, Thôi chào: Tay phải nâng lên theo đường ngắn nhất, ngón tay khép sát, đầu ngón tay giữa chạm vào vành mũ bên phải.',
      },
      {
        id: 'left',
        name: 'Quay bên trái',
        animation: 'TurnLeft',
        description: 'Quan sát chuyển hướng 90° tại chỗ. Nhấn lại động tác để phát lại.',
        sgkBadge: 'SGK 10 · Bài 9 (Mục I)',
        sgkDetail: 'Quay bên trái: Lấy gót chân trái và mũi chân phải làm trụ, xoay người sang trái 90°, sau đó kéo chân phải lên thành thế nghiêm.',
      },
      {
        id: 'right',
        name: 'Quay bên phải',
        animation: 'TurnRight',
        description: 'Quan sát phối hợp thân, hông và chân khi chuyển hướng 90° sang phải.',
        sgkBadge: 'SGK 10 · Bài 9 (Mục I)',
        sgkDetail: 'Quay bên phải: Lấy gót chân phải và mũi chân trái làm trụ, xoay người sang phải 90°, sau đó thu chân trái lên sát chân phải.',
      },
      {
        id: 'idle',
        name: 'Tư thế tự nhiên',
        animation: 'Idle',
        description: 'Quan sát toàn thân, tỷ lệ nhân vật và chuyển động thở nhẹ.',
        sgkBadge: 'SGK 10 · Bài 9',
        sgkDetail: 'Tác phong quân nhân cơ bản khi đứng trong hàng ngũ và sinh hoạt điều lệnh.',
      },
    ],
  },
  {
    id: 'vandong',
    title: 'Vận động',
    icon: Move,
    sgkBadge: 'SGK 10 · Bài 11 & 9',
    sgkLesson: 'Bài 11: Các tư thế, động tác cơ bản vận động trong chiến đấu & Bài 9: Đi đều',
    sgkSection: 'Mục I: Đi khom, chạy khom, vọt tiến (Bài 11) & Động tác Đi đều, đứng lại (Bài 9)',
    pdfFile: '/books/gdqp10-kntt.pdf',
    pdfLabel: 'SGK GDQP-AN 10 (Kết nối tri thức)',
    actions: [
      {
        id: 'walk',
        name: 'Đi bộ',
        animation: 'Walk',
        description: 'Theo dõi nhịp bước, đánh tay đối bên và chuyển trọng tâm trên đường tập. Nhân vật di chuyển theo đường vòng khép kín.',
        sgkBadge: 'SGK 10 · Bài 9 (Mục II)',
        sgkDetail: 'Động tác Đi đều: Chân bước dứt khoát, tay đánh ra trước gập khuỷu, tay đánh về sau thẳng tự nhiên, nhịp bước đều đặn.',
      },
      {
        id: 'run',
        name: 'Chạy bộ',
        animation: 'Run',
        description: 'Quan sát nhịp vận động nhanh hơn, đầu gối, cánh tay và độ nghiêng thân.',
        sgkBadge: 'SGK 10 · Bài 11 (Mục I)',
        sgkDetail: 'Động tác Chạy khom / Vọt tiến: Thân hơi cúi, lợi dụng địa hình lướt nhanh qua bãi trống hỏa lực địch.',
      },
      {
        id: 'sit',
        name: 'Ngồi xuống',
        animation: 'SitDown',
        description: 'Quan sát chuyển từ đứng sang tư thế ngồi thấp. Tư thế cuối được giữ để quan sát.',
        sgkBadge: 'SGK 10 · Bài 11',
        sgkDetail: 'Tư thế ngồi sau vật che khuất, che đỡ: Hạ thấp độ cao thân thể tránh đạn thẳng trong khi vẫn quan sát trận địa.',
      },
      {
        id: 'stand',
        name: 'Đứng lên',
        animation: 'StandUp',
        description: 'Chuyển từ tư thế ngồi thấp về đứng; quan sát phối hợp đầu gối và thân.',
        sgkBadge: 'SGK 10 · Bài 11',
        sgkDetail: 'Động tác đứng dậy: Bật người nhanh, giữ vũ khí chắc chắn, sẵn sàng cơ động chuyển vị trí bắn.',
      },
      {
        id: 'rest',
        name: 'Dừng nghỉ',
        animation: 'Idle',
        description: 'Dừng tại vị trí hiện tại trên đường tập và quan sát nhịp thở.',
        sgkBadge: 'SGK 10 · Bài 11',
        sgkDetail: 'Dừng lại quan sát địa hình, chỉnh đốn trang bị và kiểm tra hướng tiến công.',
      },
    ],
  },
  {
    id: 'diahinh',
    title: 'Địa hình',
    icon: MapPin,
    sgkBadge: 'SGK 11 · Bài 8',
    sgkLesson: 'Bài 8: Lợi dụng địa hình, địa vật',
    sgkSection: 'Mục I & II: Khái niệm Vật che khuất, Vật che đỡ và cách lợi dụng trong chiến đấu',
    pdfFile: '/books/giao-duc-quoc-phong-an-ninh-11-knttvcs.pdf',
    pdfLabel: 'SGK GDQP-AN 11 (Kết nối tri thức)',
    actions: [
      {
        id: 'vegetation',
        name: 'Vật che khuất · Bụi cây',
        animation: 'LookAround',
        zone: 'vegetation',
        camera: 'vegetationArea',
        description: 'Quan sát thân, nhánh, tán cây và bụi thấp. So sánh khoảng trống giữa các lớp cây khi xoay góc nhìn.',
        sgkBadge: 'SGK 11 · Bài 8 (Mục I)',
        sgkDetail: 'Vật che khuất: Những vật chỉ có tác dụng che giấu hành động, không chống được đạn bắn thẳng (bụi cây, lùm cỏ, rặng tre).',
      },
      {
        id: 'wall',
        name: 'Tường gạch & bê tông',
        animation: 'Idle',
        zone: 'wall',
        camera: 'wallArea',
        description: 'So sánh hai loại vật liệu, bề dày, chân tường và các cạnh bo nhẹ.',
        sgkBadge: 'SGK 11 · Bài 8 (Mục I)',
        sgkDetail: 'Vật che đỡ kiên cố: Ngăn chặn được đạn bắn thẳng và mảnh bom mìn, làm điểm tỳ bắn súng vững chắc (tường gạch, bờ tường đá).',
      },
      {
        id: 'sandbag',
        name: 'Khu bao cát',
        animation: 'LookAround',
        zone: 'sandbag',
        camera: 'sandbagArea',
        description: 'Quan sát hình dáng từng bao, nếp bo tròn và các hàng xếp so le.',
        sgkBadge: 'SGK 11 · Bài 8 (Mục I & II)',
        sgkDetail: 'Công sự bao cát dã chiến: Hấp thụ tốt xung lực đạn bộ binh, vừa che đỡ vừa tạo bệ tì ổn định cho xạ thủ.',
      },
      {
        id: 'trench',
        name: 'Hào mô phỏng',
        animation: 'Idle',
        zone: 'trench',
        camera: 'trenchArea',
        description: 'Xoay góc nhìn để thấy đáy thấp, thành hào, đoạn đổi hướng và bờ đất hai bên.',
        sgkBadge: 'SGK 11 · Bài 8 (Mục II)',
        sgkDetail: 'Chiến hào dã chiến: Tuyến công sự giao thông hào kết hợp ụ chiến đấu giúp cơ động an toàn và giữ vững trận địa phòng ngự.',
      },
      {
        id: 'open',
        name: 'Vùng đất trống',
        animation: 'LookAround',
        zone: 'open',
        camera: 'openArea',
        description: 'Quan sát khoảng đất mở, mốc khu vực và thay đổi nhẹ của bề mặt địa hình.',
        sgkBadge: 'SGK 11 · Bài 8 (Mục II)',
        sgkDetail: 'Địa hình trống trải: Nơi không có vật che chở, đòi hỏi vận dụng động tác bò, trườn hoặc vọt tiến cực nhanh khi vượt qua.',
      },
    ],
  },
  {
    id: 'laban',
    title: 'La bàn',
    icon: Compass,
    sgkBadge: 'SGK 12 · Bài 7',
    sgkLesson: 'Bài 7: Tìm và giữ phương hướng',
    sgkSection: 'Mục I: Xác định phương hướng bằng địa bàn (la bàn quân sự)',
    pdfFile: '/books/gdqpan-12-kntt.pdf',
    pdfLabel: 'SGK GDQP-AN 12 (Kết nối tri thức)',
    actions: [
      {
        id: 'monap',
        name: 'Mở nắp la bàn',
        description: 'Quan sát nắp mở và mặt chia độ từ góc nhìn phía trên.',
        sgkBadge: 'SGK 12 · Bài 7 (Mục I)',
        sgkDetail: 'Cấu tạo địa bàn: Vỏ ngoài bằng kim loại/nhựa cứng, có nắp gập bảo vệ mặt kính và hệ thống lăng kính ngắm đo.',
      },
      {
        id: 'needle_demo',
        name: 'Kim chỉ hướng Bắc',
        description: 'Quan sát kim và các ký hiệu chỉ hướng trên mặt la bàn.',
        sgkBadge: 'SGK 12 · Bài 7 (Mục I)',
        sgkDetail: 'Nguyên lý định hướng: Kim nam châm tự do luôn chỉ hướng Bắc từ (N). Vòng chia độ 360° và 64 ly giác (vạch chia quân sự).',
      },
      {
        id: 'dongnap',
        name: 'Đóng nắp bảo vệ',
        description: 'Quan sát chuyển động bản lề khi gập nắp bảo vệ mặt la bàn.',
        sgkBadge: 'SGK 12 · Bài 7 (Mục I)',
        sgkDetail: 'Quy tắc bảo quản địa bàn: Luôn đóng nắp hãm kim khi không đo đạc để tránh va đập làm hỏng trục chóp đá kim nam châm.',
      },
      {
        id: 'dophuongvi',
        name: 'Đo góc phương vị',
        description: 'Quan sát khe ngắm và vòng chia độ bằng cách xoay hoặc phóng to mô hình.',
        sgkBadge: 'SGK 12 · Bài 7 (Mục I)',
        sgkDetail: 'Đo góc phương vị từ: Đặt địa bàn thăng bằng, hướng khe ngắm - dây sợi tóc vào mục tiêu, đọc số đo góc trên vành chia độ.',
      },
    ],
  },
];
const CAMERA_BUTTONS: [CameraPreset, string][] = [
  ['overview', 'Toàn cảnh'], ['formationArea', 'Sân đội ngũ'], ['movementArea', 'Đường tập'],
  ['vegetationArea', 'Cây & bụi'], ['wallArea', 'Tường'], ['sandbagArea', 'Bao cát'],
  ['trenchArea', 'Hào mô phỏng'], ['openArea', 'Khu quan sát'],
];

function Loader() {
  const { progress } = useProgress();
  return <Html center><div role="status" className="min-w-48 rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-center text-xs text-white">
    <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-600 border-t-red-500" />
    Đang tải mô hình · {progress.toFixed(0)}%
  </div></Html>;
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Training scene could not load:', error); }
  render() {
    return this.state.failed ? <div role="alert" className="grid h-full place-content-center gap-3 p-8 text-center text-sm text-white">
      <p>Không thể tải mô hình 3D. Vui lòng kiểm tra kết nối và tải lại.</p>
      <button className="rounded-xl bg-red-600 p-2 font-bold" onClick={() => window.location.reload()}>Tải lại mô hình</button>
    </div> : this.props.children;
  }
}

function CompassModel({ actionId, paused, replay }: { actionId: string; paused: boolean; replay: number }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF('/models/04_gdqp_la_ban.glb');
  const model = useMemo(() => scene.clone(true), [scene]);
  const { actions, mixer } = useAnimations(animations, group);
  useEffect(() => {
    Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    const name = actionId === 'dongnap' ? 'DongNap' : actionId === 'monap' ? 'MoNap' : 'NeedleDemo';
    if (name === 'NeedleDemo' && actions.MoNap) {
      const open = actions.MoNap.reset().setLoop(LoopOnce, 1).play();
      open.time = open.getClip().duration; open.paused = true; open.clampWhenFinished = true;
    }
    const action = actions[name];
    if (action) {
      action.reset().setLoop(name === 'NeedleDemo' ? LoopRepeat : LoopOnce, name === 'NeedleDemo' ? Infinity : 1);
      action.clampWhenFinished = true; action.fadeIn(0.2).play();
    }
  }, [actions, actionId, replay]);
  useEffect(() => { mixer.timeScale = paused ? 0 : 1; }, [mixer, paused]);
  return <group ref={group} scale={0.95} dispose={null}><primitive object={model} /></group>;
}

/** Distance-parametrized capsule route entirely on the flat dirt lane. */
function MovingSoldiers({ animation, paused, replay, squad }: { animation: SoldierAnimationName; paused: boolean; replay: number; squad: boolean }) {
  const soldiers = useRef<(Group | null)[]>([]);
  const distance = useRef(0), speed = useRef(0);
  useFrame((_, rawDelta) => {
    if (!paused) {
      const delta = Math.min(rawDelta, 0.05);
      const targetSpeed = animation === 'Walk' ? 1.05 : animation === 'Run' ? 2.55 : 0;
      speed.current = targetSpeed === 0 ? 0 : MathUtils.damp(speed.current, targetSpeed, 12, delta);
      distance.current = (distance.current + speed.current * delta) % MOVEMENT_ROUTE_LENGTH;
    }
    soldiers.current.forEach((soldier, index) => {
      if (!soldier) return;
      // Every actor samples its own place along the route. Rotating a formation
      // offset around the leader would swing followers off the lane on bends.
      const pose = sampleMovementRoute(distance.current - index * SQUAD_SPACING_METERS);
      soldier.position.set(...pose.position);
      soldier.rotation.y = pose.yaw;
    });
  });
  return <group>{Array.from({ length: squad ? 3 : 1 }, (_, index) => {
    const pose = sampleMovementRoute(-index * SQUAD_SPACING_METERS);
    return <group key={index} ref={(value) => { soldiers.current[index] = value; }} position={pose.position} rotation={[0, pose.yaw, 0]}>
      <Soldier3D animation={animation} paused={paused} resetSignal={replay} />
    </group>;
  })}</group>;
}

function RenderStats({ report }: { report: (stats: string) => void }) {
  const elapsed = useRef(0);
  useFrame(({ gl }, delta) => {
    elapsed.current += delta;
    if (elapsed.current > 2) { report(`${gl.info.render.calls} draws · ${Math.round(gl.info.render.triangles / 1000)}k tris`); elapsed.current = 0; }
  });
  return null;
}

export default function Tactical3DSimulation() {
  const [category, setCategory] = useState<Category>('doingu');
  const [actionId, setActionId] = useState('attention');
  const [paused, setPaused] = useState(false), [squad, setSquad] = useState(false);
  const [replay, setReplay] = useState(0), [cameraReset, setCameraReset] = useState(0);
  const [preset, setPreset] = useState<CameraPreset>('formationArea');
  const [debugAnimation, setDebugAnimation] = useState<SoldierAnimationName | ''>('');
  const [stats, setStats] = useState('');
  const current = CATEGORIES.find((item) => item.id === category)!;
  const action = current.actions.find((item) => item.id === actionId) ?? current.actions[0];
  const animation = debugAnimation || action.animation || 'Idle';
  const zone: GroundZone = action.zone ?? (category === 'vandong' ? 'movement' : 'formation');
  const isCompass = category === 'laban';
  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFullscreen = () => {
    if (!viewportContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewportContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const focusCamera = (next: CameraPreset) => { setPreset(next); setCameraReset((value) => value + 1); };
  const selectAction = (next: ActionItem) => {
    setActionId(next.id); setDebugAnimation(''); setPaused(false); setReplay((value) => value + 1);
    focusCamera(next.camera ?? (isCompass ? 'compass' : category === 'vandong' ? 'movementArea' : 'formationArea'));
  };
  const selectCategory = (next: Category) => {
    const first = CATEGORIES.find((item) => item.id === next)!.actions[0];
    setCategory(next); setActionId(first.id); setDebugAnimation(''); setPaused(false); setReplay((value) => value + 1);
    focusCamera(first.camera ?? (next === 'laban' ? 'compass' : next === 'vandong' ? 'movementArea' : 'formationArea'));
  };

  return <div className="flex w-full min-w-0 flex-col space-y-4">
    <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
      <div><span className="block font-mono text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Thực hành trực quan 3D</span>
        <h1 className="text-xl font-black leading-tight text-slate-900 dark:text-white sm:text-2xl">Mô phỏng Thao trường & Điều lệnh quân sự</h1></div>
      <div aria-label="Nội dung thao trường" className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
        {CATEGORIES.map((cat) => <button key={cat.id} onClick={() => selectCategory(cat.id)} aria-pressed={category === cat.id}
          className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-bold transition-colors sm:px-3 ${category === cat.id ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
          <cat.icon className="h-3.5 w-3.5" />
          <span>{cat.title}</span>
          <span className={`hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${category === cat.id ? 'bg-black/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
            {cat.sgkBadge}
          </span>
        </button>)}
      </div>
    </div>

    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      <div ref={viewportContainerRef} data-testid="training-viewport" data-animation={animation} data-camera={preset} data-paused={paused}
        className={`relative ${isFullscreen ? 'fixed inset-0 z-[99999] h-screen w-screen rounded-none border-none' : isExpanded ? 'h-[640px] sm:h-[720px] lg:h-[800px] rounded-3xl lg:col-span-12' : 'h-[480px] sm:h-[580px] lg:col-span-8 lg:h-[680px] xl:h-[720px] rounded-3xl'} min-w-0 overflow-hidden border border-slate-700 bg-[#b5c7ce] shadow-lg transition-all duration-300`}>
        <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {!isCompass ? <div className="flex gap-0.5 rounded-xl border border-white/15 bg-slate-950/85 p-1 text-[11px] font-bold text-white backdrop-blur-md">
              <button aria-pressed={!squad} onClick={() => setSquad(false)} className={`rounded-lg px-2.5 py-1.5 ${!squad ? 'bg-red-600' : 'text-slate-300'}`}>1 chiến sĩ</button>
              <button aria-pressed={squad} onClick={() => setSquad(true)} className={`rounded-lg px-2.5 py-1.5 ${squad ? 'bg-red-600' : 'text-slate-300'}`}>Đội hình 3</button>
            </div> : <div className="rounded-xl bg-slate-950/85 px-3 py-2 text-xs font-bold text-amber-300 border border-white/15 backdrop-blur-md">La bàn 3D</div>}

            <a
              href={current.pdfFile}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/85 hover:bg-blue-900/90 text-blue-200 border border-blue-500/40 text-xs font-semibold backdrop-blur-md shadow-md transition-colors"
              title={`Căn cứ SGK: ${current.sgkLesson} (${current.pdfLabel}) - Bấm để mở PDF`}
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              <span>{action.sgkBadge || current.sgkBadge}</span>
            </a>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button aria-label="Đặt lại góc nhìn" onClick={() => focusCamera(isCompass ? 'compass' : 'formationArea')} className="rounded-xl border border-white/15 bg-slate-950/85 p-2.5 text-white cursor-pointer hover:bg-slate-800" title="Góc nhìn điều lệnh cận cảnh"><RotateCcw className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPaused((value) => !value)} className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/85 px-3 py-2 text-[11px] font-bold text-white cursor-pointer hover:bg-slate-800">
              {paused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5 text-amber-300" />}{paused ? 'Tiếp tục' : 'Tạm dừng'}</button>
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`rounded-xl border border-white/15 p-2.5 text-white transition-colors cursor-pointer ${isExpanded ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-950/85 hover:bg-slate-800'}`}
              title={isExpanded ? 'Thu gọn khung nhìn' : 'Phóng to 100% khung nhìn'}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className={`rounded-xl border border-white/15 p-2.5 text-white transition-colors cursor-pointer ${isFullscreen ? 'bg-red-600' : 'bg-slate-950/85 hover:bg-slate-800'}`}
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <SceneBoundary><Canvas shadows dpr={[1, 1.5]} camera={{ position: [-12.2, 1.8, 7.6], fov: 44, near: 0.1, far: 180 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <color attach="background" args={['#b5c7ce']} /><fog attach="fog" args={['#b5c7ce', 65, 145]} />
          <hemisphereLight args={['#e1efff', '#717457', 2]} />
          <directionalLight position={[-24, 38, 22]} intensity={2.6} castShadow shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-43} shadow-camera-right={43} shadow-camera-top={37} shadow-camera-bottom={-37}
            shadow-camera-near={1} shadow-camera-far={100} shadow-bias={-0.0004} shadow-normalBias={0.06} />
          <Suspense fallback={<Loader />}>
            {isCompass ? <CompassModel actionId={action.id} paused={paused} replay={replay} /> : <>
              <TrainingGroundModel highlightedZone={preset === 'overview' ? undefined : zone} />
              {category === 'vandong' ? <MovingSoldiers animation={animation} paused={paused} replay={replay} squad={squad} /> : <group position={OBSERVATION_POINTS[zone]}>
                <Soldier3D animation={animation} paused={paused} resetSignal={replay} />
                {squad && <><Soldier3D position={[-1.5, 0, 0]} animation={animation} paused={paused} resetSignal={replay} />
                  <Soldier3D position={[1.5, 0, 0]} animation={animation} paused={paused} resetSignal={replay} /></>}
              </group>}
            </>}
          </Suspense>
          <TrainingCameraController preset={preset} resetSignal={cameraReset} />
          {import.meta.env.DEV && <RenderStats report={setStats} />}
        </Canvas></SceneBoundary>

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center">
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/80 px-3 py-1.5 text-center text-[10px] font-medium text-slate-200 backdrop-blur-md"><Eye className="h-3 w-3 shrink-0 text-amber-300" />Kéo để xoay · Cuộn để zoom · Hai ngón để xoay / thu phóng</div>
        </div>
        {import.meta.env.DEV && stats && <span data-testid="training-render-stats" className="pointer-events-none absolute bottom-12 right-3 rounded bg-slate-950/70 px-2 py-1 font-mono text-[9px] text-slate-300">{stats}</span>}
      </div>

      <div className={`min-w-0 space-y-4 ${isExpanded ? 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0' : 'lg:col-span-4'} transition-all duration-300`}>
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#111827]">
          <div><span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400">Quan sát & thực hành</span>
            <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{current.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Chọn nội dung để xem chuyển động và khám phá từng khu vực.</p></div>
          <div className="grid grid-cols-2 gap-2">
            {current.actions.map((item) => <button key={item.id} onClick={() => selectAction(item)} aria-pressed={action.id === item.id}
              className={`flex flex-col items-start justify-between gap-1 rounded-2xl border p-2.5 text-left transition-colors cursor-pointer ${action.id === item.id ? 'border-emerald-600 bg-emerald-700 text-white shadow-sm dark:bg-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200'}`}>
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold">{item.name}</span>
                {action.id === item.id && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              </div>
              {item.sgkBadge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${action.id === item.id ? 'bg-black/20 text-emerald-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {item.sgkBadge}
                </span>
              )}
            </button>)}
          </div>
          <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/60 dark:bg-slate-900/80">
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-400"><Eye className="h-4 w-4" />Điểm cần quan sát</h3>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">{action.description}</p>
          </div>

          {/* Căn cứ bài học SGK (PDF nguồn) */}
          <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-slate-900/90">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-xs font-black text-blue-800 dark:text-blue-400">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                CĂN CỨ BÀI HỌC SGK (PDF)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold font-mono">
                {action.sgkBadge || current.sgkBadge}
              </span>
            </div>

            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug">
              {current.sgkLesson}
            </div>

            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {action.sgkDetail || current.sgkSection}
            </p>

            <div className="pt-1 flex items-center justify-between">
              <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium">
                {current.pdfLabel}
              </span>
              <a
                href={current.pdfFile}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
              >
                <span>Mở SGK PDF</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <button onClick={() => { setPaused(false); setReplay((value) => value + 1); }} className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-red-600 dark:text-slate-300"><RotateCcw className="h-3.5 w-3.5" />Phát lại động tác</button>
        </div>
        {!isCompass && <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><Maximize2 className="h-3.5 w-3.5 text-red-500" />Góc nhìn sân tập</h3>
          <div className="grid grid-cols-2 gap-2">{CAMERA_BUTTONS.map(([id, title]) => <button key={id} aria-pressed={preset === id} onClick={() => focusCamera(id)}
            className={`rounded-xl border px-3 py-2 text-left text-[11px] font-semibold transition-colors ${preset === id ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400' : 'border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'}`}>{title}</button>)}</div>
        </div>}
        {import.meta.env.DEV && !isCompass && <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Animation (dev)<select aria-label="Animation (dev)" value={debugAnimation} onChange={(event) => { setDebugAnimation(event.target.value as SoldierAnimationName | ''); setReplay((value) => value + 1); }} className="min-w-0 flex-1 rounded-lg bg-slate-100 p-2 text-slate-800 dark:bg-slate-800 dark:text-white">
            <option value="">Theo nội dung</option>{SOLDIER_ANIMATIONS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select></label>}
      </div>
    </div>
  </div>;
}
