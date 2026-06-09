import { Asset, BorrowRecord, User, Department, AssetCategory } from '@/types';

export const departments: Department[] = [
  { id: 'dept-1', name: '技术部', managerId: 'user-1', employeeCount: 25 },
  { id: 'dept-2', name: '市场部', managerId: 'user-2', employeeCount: 15 },
  { id: 'dept-3', name: '销售部', managerId: 'user-3', employeeCount: 20 },
  { id: 'dept-4', name: '行政部', managerId: 'user-4', employeeCount: 8 },
  { id: 'dept-5', name: '财务部', managerId: 'user-5', employeeCount: 6 },
  { id: 'dept-6', name: '人事部', managerId: 'user-6', employeeCount: 5 },
];

export const categories: AssetCategory[] = [
  { id: 'cat-1', name: '笔记本电脑', icon: 'Laptop' },
  { id: 'cat-2', name: '投影仪', icon: 'Projector' },
  { id: 'cat-3', name: '办公车辆', icon: 'Car' },
  { id: 'cat-4', name: '相机/摄像机', icon: 'Camera' },
  { id: 'cat-5', name: '音响设备', icon: 'Speaker' },
  { id: 'cat-6', name: '显示器', icon: 'Monitor' },
  { id: 'cat-7', name: '外设配件', icon: 'Headphones' },
  { id: 'cat-8', name: '会议设备', icon: 'Video' },
];

export const users: User[] = [
  { id: 'user-1', name: '张伟', email: 'zhangwei@company.com', departmentId: 'dept-1', departmentName: '技术部', role: 'admin', avatar: 'ZW' },
  { id: 'user-2', name: '李娜', email: 'lina@company.com', departmentId: 'dept-2', departmentName: '市场部', role: 'approver', avatar: 'LN' },
  { id: 'user-3', name: '王强', email: 'wangqiang@company.com', departmentId: 'dept-3', departmentName: '销售部', role: 'approver', avatar: 'WQ' },
  { id: 'user-4', name: '刘芳', email: 'liufang@company.com', departmentId: 'dept-4', departmentName: '行政部', role: 'admin', avatar: 'LF' },
  { id: 'user-5', name: '陈明', email: 'chenming@company.com', departmentId: 'dept-5', departmentName: '财务部', role: 'employee', avatar: 'CM' },
  { id: 'user-6', name: '赵丽', email: 'zhaoli@company.com', departmentId: 'dept-6', departmentName: '人事部', role: 'employee', avatar: 'ZL' },
  { id: 'user-7', name: '孙磊', email: 'sunlei@company.com', departmentId: 'dept-1', departmentName: '技术部', role: 'employee', avatar: 'SL' },
  { id: 'user-8', name: '周婷', email: 'zhouting@company.com', departmentId: 'dept-1', departmentName: '技术部', role: 'employee', avatar: 'ZT' },
  { id: 'user-9', name: '吴杰', email: 'wujie@company.com', departmentId: 'dept-2', departmentName: '市场部', role: 'employee', avatar: 'WJ' },
  { id: 'user-10', name: '郑浩', email: 'zhenghao@company.com', departmentId: 'dept-3', departmentName: '销售部', role: 'employee', avatar: 'ZH' },
  { id: 'user-11', name: '黄敏', email: 'huangmin@company.com', departmentId: 'dept-1', departmentName: '技术部', role: 'employee', avatar: 'HM' },
  { id: 'user-12', name: '林峰', email: 'linfeng@company.com', departmentId: 'dept-2', departmentName: '市场部', role: 'employee', avatar: 'LF' },
  { id: 'user-13', name: '徐静', email: 'xujing@company.com', departmentId: 'dept-3', departmentName: '销售部', role: 'employee', avatar: 'XJ' },
  { id: 'user-14', name: '马超', email: 'machao@company.com', departmentId: 'dept-4', departmentName: '行政部', role: 'approver', avatar: 'MC' },
  { id: 'user-15', name: '杨洋', email: 'yangyang@company.com', departmentId: 'dept-1', departmentName: '技术部', role: 'employee', avatar: 'YY' },
  { id: 'user-16', name: '朱琳', email: 'zhulin@company.com', departmentId: 'dept-5', departmentName: '财务部', role: 'employee', avatar: 'ZL' },
  { id: 'user-17', name: '胡军', email: 'hujun@company.com', departmentId: 'dept-6', departmentName: '人事部', role: 'employee', avatar: 'HJ' },
  { id: 'user-18', name: '林小燕', email: 'linxiaoyan@company.com', departmentId: 'dept-1', departmentName: '技术部', role: 'employee', avatar: 'LXY' },
  { id: 'user-19', name: '何志强', email: 'hezhiqiang@company.com', departmentId: 'dept-3', departmentName: '销售部', role: 'employee', avatar: 'HZQ' },
  { id: 'user-20', name: '高雯', email: 'gaowen@company.com', departmentId: 'dept-2', departmentName: '市场部', role: 'employee', avatar: 'GW' },
];

const generateId = (prefix: string, num: number) => `${prefix}-${num.toString().padStart(3, '0')}`;

const assetNames: { [key: string]: string[] } = {
  'cat-1': ['MacBook Pro 14寸', 'MacBook Pro 16寸', 'ThinkPad X1 Carbon', 'Dell XPS 15', 'HP EliteBook 840', 'Lenovo ThinkBook 14', 'ASUS ZenBook 14', 'Microsoft Surface Laptop'],
  'cat-2': ['Epson投影仪 CB-X41', 'BenQ投影仪 MH550', 'Optoma投影仪 HD27e', 'Sony投影仪 VPL-PHZ10', 'NEC投影仪 NP-CD1100H'],
  'cat-3': ['别克GL8商务车', '大众帕萨特', '丰田凯美瑞', '本田雅阁', '比亚迪汉EV', '特斯拉Model 3'],
  'cat-4': ['Canon EOS R5 相机', 'Sony A7S III 相机', 'Nikon Z7 II 相机', 'DJI Mini 3 Pro 无人机', 'GoPro Hero 11 运动相机', 'Sony ZV-E10 微单'],
  'cat-5': ['JBL Xtreme 3 蓝牙音箱', 'Bose SoundLink Revolve+', 'Sony SRS-XB43 音箱', 'Marshall Kilburn II 音箱', 'Shure SLX24/SM58 无线麦'],
  'cat-6': ['Dell U2723QE 27寸', 'LG 32UN880 32寸', 'Samsung S34A650UX 34寸', 'BenQ PD3220U 32寸', 'Apple Studio Display 27寸'],
  'cat-7': ['罗技MX Master 3S鼠标', 'HHKB Professional HYBRID键盘', 'Blue Yeti 麦克风', '罗技C920e摄像头', '索尼WH-1000XM5耳机'],
  'cat-8': ['罗技CC4000e会议摄像头', 'Poly Studio X70 会议系统', 'Yealink UVC84 会议摄像头', 'H3C Magic S1E 投屏器', '小米电视大师 82寸'],
};

const locations = ['A栋3楼办公区', 'B栋2楼会议室', 'C栋1楼仓库', 'D栋4楼研发中心', 'E栋5楼高管区', 'F栋B1停车场'];

const generateImagePrompt = (categoryName: string, assetName: string) => {
  const encodedPrompt = encodeURIComponent(`professional product photo of ${assetName}, ${categoryName}, white background, studio lighting, high quality, commercial photography`);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodedPrompt}&image_size=square`;
};

export const assets: Asset[] = [];
let assetNum = 1;

for (let i = 0; i < 50; i++) {
  const categoryId = `cat-${((i % 8) + 1)}`;
  const categoryName = categories.find(c => c.id === categoryId)?.name || '';
  const names = assetNames[categoryId] || ['设备'];
  const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
  const statuses: Asset['status'][] = ['available', 'available', 'available', 'borrowed', 'borrowed', 'maintenance'];
  const status = statuses[i % statuses.length];
  const managerIndex = (i + 1) % 20;
  const purchaseDate = new Date(2022 + (i % 3), i % 12, 1 + (i % 28)).toISOString().split('T')[0];
  
  assets.push({
    id: generateId('ast', i + 1),
    name,
    assetNo: generateId('AST', assetNum++),
    categoryId,
    categoryName,
    status,
    location: locations[i % locations.length],
    managerId: users[managerIndex].id,
    managerName: users[managerIndex].name,
    description: `${name}，购买于${purchaseDate}，适用于日常办公和会议使用。定期维护保养，状态良好。`,
    imageUrl: generateImagePrompt(categoryName, name),
    purchaseDate,
    purchasePrice: Math.floor(Math.random() * 20000) + 1000,
    attachments: i % 3 === 0 ? ['采购合同.pdf', '保修卡.pdf'] : [],
    createdAt: new Date(2023, 0, 1).toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

const today = new Date();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const borrowRecords: BorrowRecord[] = [];
const statusSequence: BorrowRecord['status'][] = [
  'pending', 'pending', 'pending',
  'approved', 'approved', 'approved', 'approved',
  'returned', 'returned', 'returned', 'returned', 'returned',
  'overdue', 'overdue',
  'rejected',
  'damaged'
];

for (let i = 0; i < 80; i++) {
  const assetIndex = i % 50;
  const asset = assets[assetIndex];
  const userIndex = (i + 2) % 20;
  const user = users[userIndex];
  const approverIndex = (i + 5) % 4;
  const approvers = users.filter(u => u.role === 'approver' || u.role === 'admin');
  const approver = approvers[approverIndex % approvers.length];
  const status = statusSequence[i % statusSequence.length];
  
  let borrowDate: Date;
  let expectedReturnDate: Date;
  let actualReturnDate: string | null = null;
  let approvedAt: string | null = null;
  
  if (status === 'pending') {
    borrowDate = addDays(today, 1);
    expectedReturnDate = addDays(today, 5);
  } else if (status === 'overdue') {
    borrowDate = addDays(today, -14);
    expectedReturnDate = addDays(today, -7);
    approvedAt = formatDate(addDays(today, -15));
  } else if (status === 'returned' || status === 'damaged') {
    borrowDate = addDays(today, -10);
    expectedReturnDate = addDays(today, -3);
    actualReturnDate = formatDate(addDays(today, -3));
    approvedAt = formatDate(addDays(today, -11));
  } else if (status === 'rejected') {
    borrowDate = addDays(today, -5);
    expectedReturnDate = addDays(today, -1);
    approvedAt = formatDate(addDays(today, -4));
  } else {
    borrowDate = addDays(today, -2);
    expectedReturnDate = addDays(today, 3);
    approvedAt = formatDate(addDays(today, -3));
  }
  
  const damageLevels: BorrowRecord['damageLevel'][] = ['none', 'none', 'none', 'minor', 'moderate', 'severe'];
  const damageLevel = status === 'damaged' ? damageLevels[i % damageLevels.length] : 'none';
  
  borrowRecords.push({
    id: generateId('bor', i + 1),
    assetId: asset.id,
    assetName: asset.name,
    assetNo: asset.assetNo,
    userId: user.id,
    userName: user.name,
    userDepartment: user.departmentName,
    approverId: approver.id,
    approverName: approver.name,
    purpose: ['项目开发使用', '客户拜访演示', '外出会议', '培训活动', '展会展示', '日常办公'][i % 6],
    borrowDate: formatDate(borrowDate),
    expectedReturnDate: formatDate(expectedReturnDate),
    actualReturnDate,
    status,
    damageLevel,
    repairCost: damageLevel === 'none' ? 0 : Math.floor(Math.random() * 2000) + 100,
    damageNote: status === 'damaged' ? '设备外壳有轻微划痕，屏幕角落有磕碰' : '',
    createdAt: formatDate(addDays(today, -20 + i)),
    approvedAt,
  });
}

export const getMockData = () => ({
  assets,
  borrowRecords,
  users,
  departments,
  categories,
});
