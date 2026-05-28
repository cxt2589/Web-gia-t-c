/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ANCESTRAL_TREE } from '../data/lineageData';
import { AncestorNode } from '../types';
import { convertSolarToLunarText, getAnniversaryCountdown } from '../utils/lunarConverter';
import { getPersistedTreeData, savePersistedTreeData, getAppSettings } from '../utils/configManager';
import { 
  Search, 
  Heart, 
  Calendar, 
  Scroll, 
  Award, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  MousePointerClick, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Bookmark,
  Users,
  Lock,
  Unlock,
  ShieldCheck,
  X,
  MapPin,
  FileText,
  Phone
} from 'lucide-react';

const getHanNomNumber = (num: number): string => {
  const hanNomDigits = ["", "Nhất", "Nhị", "Tam", "Tứ", "Ngũ", "Lục", "Thất", "Bát", "Cửu", "Thập"];
  if (num <= 10) {
    return hanNomDigits[num];
  }
  if (num < 20) {
    return "Thập " + hanNomDigits[num - 10];
  }
  if (num === 20) {
    return "Nhị Thập";
  }
  if (num < 30) {
    return "Nhị Thập " + hanNomDigits[num - 20];
  }
  if (num === 30) {
    return "Tam Thập";
  }
  if (num < 40) {
    return "Tam Thập " + hanNomDigits[num - 30];
  }
  return num.toString();
};

const formatNodeTitle = (node: {
  generation: number;
  isLiving?: boolean;
  birthYear?: string;
  deathYear?: string;
  title?: string;
  rankRole?: string;
  customSuffix?: string;
}): string => {
  const isLiving = node.isLiving || (!node.deathYear && node.birthYear && parseInt(node.birthYear) > 1920);
  
  let role = node.rankRole || '';
  let suffix = node.customSuffix || '';
  
  if (!node.rankRole && node.title) {
    // legacy parse
    let cleanTitle = node.title;
    cleanTitle = cleanTitle.replace(/^Đệ\s+[A-Za-zĂăÂâĐđÊêÔôƠơƯưỨứ\s]+\s+thế\s+tổ(?:\s*-\s*|\s+)?/gi, '');
    cleanTitle = cleanTitle.replace(/^Hậu\s+duệ\s+đời\s+\d+(?:\s*-\s*|\s+)?/gi, '');
    
    const roles = ["trưởng chi", "trưởng tộc", "đệ nhị", "đệ tam", "gái cả", "gái thứ 1-2-3", "gái thứ 1", "gái thứ 2", "gái thứ 3", "đích tôn"];
    const foundRole = roles.find(r => cleanTitle.toLowerCase().includes(r));
    if (foundRole) {
      const index = cleanTitle.toLowerCase().indexOf(foundRole);
      role = cleanTitle.substring(index, index + foundRole.length);
      const part1 = cleanTitle.substring(0, index).trim();
      const part2 = cleanTitle.substring(index + foundRole.length).trim();
      suffix = [part1, part2].filter(Boolean).join(' ').replace(/^\s*-\s*|\s*-\s*$/g, '').trim();
    } else {
      role = '';
      suffix = cleanTitle.trim();
    }
  }

  const roleFormatted = role ? role.trim() : '';
  const suffixFormatted = suffix ? suffix.trim() : '';
  
  if (isLiving) {
    const parts = [
      `Hậu duệ đời ${node.generation}`,
      roleFormatted,
      suffixFormatted
    ].filter(Boolean);
    return parts.join(' - ');
  } else {
    const hanNomGen = getHanNomNumber(node.generation);
    const prefix = `Đệ ${hanNomGen} thế tổ`;
    const parts = [
      prefix,
      roleFormatted,
      suffixFormatted
    ].filter(Boolean);
    return parts.join(' - ');
  }
};

interface LineageSpec {
  role: string;
  dot?: 'green' | 'blue';
  borderColor?: string;
  isTruongToc?: boolean;
}

const isMaleNode = (node: AncestorNode): boolean => {
  if (node.gender === 'nữ') return false;
  if (node.gender === 'nam') return true;
  const name = node.name || "";
  const words = name.split(/\s+/);
  return !words.some(w => w.toLowerCase() === 'thị');
};

const isNodeLiving = (node: AncestorNode): boolean => {
  return !!(node.isLiving || (!node.deathYear && node.birthYear && parseInt(node.birthYear) > 1920));
};

const getSons = (node: AncestorNode): AncestorNode[] => {
  if (!node.children) return [];
  return node.children.filter(isMaleNode);
};

const hasSons = (node: AncestorNode): boolean => {
  return getSons(node).length > 0;
};

const hasActiveLineageDescendant = (node: AncestorNode): boolean => {
  const sons = getSons(node);
  if (sons.some(isNodeLiving)) return true;
  if (sons.some(s => getSons(s).length > 0)) return true;
  for (const s of sons) {
    if (hasActiveLineageDescendant(s)) return true;
  }
  return false;
};

const computeClanLeaderRules = (root: AncestorNode): Record<string, LineageSpec> => {
  const specs: Record<string, LineageSpec> = {};

  const parentMap: Record<string, AncestorNode> = {};
  const buildParentMap = (node: AncestorNode, parent: AncestorNode | null) => {
    if (parent) parentMap[node.id] = parent;
    if (node.children) {
      node.children.forEach(c => buildParentMap(c, node));
    }
  };
  buildParentMap(root, null);

  const leaderByGen: Record<number, string> = {}; 

  leaderByGen[1] = root.id;

  for (let g = 1; g < 20; g++) {
    const leaderId = leaderByGen[g];
    if (!leaderId) break;

    const leaderNode = findByNodeId(root, leaderId);
    if (!leaderNode) continue;

    const leaderIsLiving = isNodeLiving(leaderNode);
    const sons = getSons(leaderNode);

    let primarySuccessor: AncestorNode | null = null;
    for (const son of sons) {
      if (isNodeLiving(son) || hasActiveLineageDescendant(son)) {
        primarySuccessor = son;
        break;
      }
    }

    if (primarySuccessor) {
      if (!leaderIsLiving) {
        leaderByGen[g + 1] = primarySuccessor.id;
      }
    } else {
      if (!leaderIsLiving) {
        const parent = parentMap[leaderNode.id];
        if (parent) {
          const brothers = getSons(parent);
          const leaderIdx = brothers.findIndex(b => b.id === leaderNode.id);
          const youngerSeq = brothers.slice(leaderIdx + 1);

          let activeBrother: AncestorNode | null = null;
          for (const b of youngerSeq) {
            if (isNodeLiving(b) || hasActiveLineageDescendant(b)) {
              activeBrother = b;
              break;
            }
          }

          if (activeBrother) {
            if (isNodeLiving(activeBrother)) {
              leaderByGen[g] = activeBrother.id;
              g--;
              continue;
            } else {
              const bSons = getSons(activeBrother);
              if (bSons.length > 0) {
                leaderByGen[g + 1] = bSons[0].id;
              }
            }
          }
        }
      }
    }
  }

  function findByNodeId(node: AncestorNode, id: string): AncestorNode | null {
    if (node.id === id) return node;
    if (node.children) {
      for (const c of node.children) {
        const res = findByNodeId(c, id);
        if (res) return res;
      }
    }
    return null;
  }

  const assignSpecs = (node: AncestorNode) => {
    const parent = parentMap[node.id];
    const living = isNodeLiving(node);
    let role = '';
    let borderColor = '';

    let siblingString = '';
    if (parent) {
      const parentSons = getSons(parent);
      const idx = parentSons.findIndex(s => s.id === node.id);
      if (idx >= 0) {
        if (idx === 0) siblingString = 'Trưởng nam';
        else if (idx === 1) siblingString = 'Đệ nhị';
        else if (idx === 2) siblingString = 'Đệ tam';
        else siblingString = `Đệ ${idx + 1}`;
      }
    }

    const isLeaderOfItsGen = Object.values(leaderByGen).includes(node.id);

    if (isLeaderOfItsGen) {
      role = 'Trưởng tộc';
      borderColor = living 
        ? 'border-red-500 ring-2 ring-red-400/60 shadow-[0_0_12px_rgba(239,68,68,0.6)]' 
        : 'border-red-300 ring-1 ring-red-300/40 shadow-[0_0_8px_rgba(239,68,68,0.4)]';
    } else {
      const parentLeaderId = parent ? leaderByGen[parent.generation] : null;
      if (parentLeaderId && parent.id === parentLeaderId) {
        const leaderSons = getSons(parent);
        let eligibleHeir: AncestorNode | null = null;
        for (const son of leaderSons) {
          if (isNodeLiving(son) || hasActiveLineageDescendant(son)) {
            eligibleHeir = son;
            break;
          }
        }

        if (eligibleHeir && node.id === eligibleHeir.id) {
          const isHeirHasSon = hasSons(node);
          role = isHeirHasSon ? 'Trưởng nam' : 'Đích tôn';
          
          if (role === 'Trưởng nam') {
            borderColor = living
              ? 'border-orange-500 ring-2 ring-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.6)] font-bold'
              : 'border-orange-300 ring-1 ring-orange-300/40 shadow-[0_0_8px_rgba(249,115,22,0.4)]';
          } else {
            borderColor = living
              ? 'border-blue-500 ring-2 ring-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.6)] font-bold'
              : 'border-[#8c716e]/25 text-ink-charcoal';
          }
        } else {
          if (isMaleNode(node)) {
            role = siblingString || 'Hậu duệ';
          } else {
            const daughters = parent.children ? parent.children.filter(c => !isMaleNode(c)) : [];
            const dIdx = daughters.findIndex(d => d.id === node.id);
            if (dIdx === 0) role = 'Gái cả';
            else if (dIdx >= 1) role = `Gái thứ ${dIdx + 1}`;
            else role = 'Hậu duệ';
          }
          borderColor = living ? 'border-amber-400' : 'border-[#8c716e]/25';
        }
      } else {
        const gparent = parent ? parentMap[parent.id] : null;
        const gpLeaderId = gparent ? leaderByGen[gparent.generation] : null;
        let isDichTonGrandson = false;
        
        if (gpLeaderId && gparent && gparent.id === gpLeaderId) {
          const gpSons = getSons(gparent);
          let gpHeir: AncestorNode | null = null;
          for (const s of gpSons) {
            if (isNodeLiving(s) || hasActiveLineageDescendant(s)) {
              gpHeir = s;
              break;
            }
          }

          if (gpHeir && parent.id === gpHeir.id) {
            const parentSons = getSons(parent);
            if (parentSons.length > 0 && node.id === parentSons[0].id) {
              isDichTonGrandson = true;
            }
          }
        }

        let isDichTonGreatGrandson = false;
        if (!isDichTonGrandson && parent) {
          const parentParent = parentMap[parent.id];
          if (parentParent) {
            const ggparent = parentMap[parentParent.id];
            const ggpLeaderId = ggparent ? leaderByGen[ggparent.generation] : null;
            if (ggpLeaderId && ggparent && ggparent.id === ggpLeaderId) {
              const ggpSons = getSons(ggparent);
              let ggpHeir: AncestorNode | null = null;
              for (const s of ggpSons) {
                if (isNodeLiving(s) || hasActiveLineageDescendant(s)) {
                  ggpHeir = s;
                  break;
                }
              }
              if (ggpHeir && parentParent.id === ggpHeir.id) {
                const parentParentSons = getSons(parentParent);
                if (parentParentSons.length > 0 && parent.id === parentParentSons[0].id) {
                  const parentSons = getSons(parent);
                  if (parentSons.length > 0 && node.id === parentSons[0].id) {
                    isDichTonGreatGrandson = true;
                  }
                }
              }
            }
          }
        }

        if (isDichTonGrandson || isDichTonGreatGrandson) {
          role = 'Đích tôn';
          borderColor = living
            ? 'border-blue-500 ring-2 ring-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.6)] font-bold'
            : 'border-[#8c716e]/25 text-ink-charcoal';
        } else {
          if (isMaleNode(node)) {
            role = siblingString || 'Hậu duệ';
          } else {
            if (parent) {
              const daughters = parent.children ? parent.children.filter(c => !isMaleNode(c)) : [];
              const dIdx = daughters.findIndex(d => d.id === node.id);
              if (dIdx === 0) role = 'Gái cả';
              else if (dIdx >= 1) role = `Gái thứ ${dIdx + 1}`;
              else role = 'Hậu duệ';
            } else {
              role = 'Hậu duệ';
            }
          }
          borderColor = living ? 'border-amber-400' : 'border-[#8c716e]/25';
        }
      }
    }

    specs[node.id] = {
      role,
      borderColor,
      isTruongToc: role === 'Trưởng tộc'
    };

    if (node.children) {
      node.children.forEach(assignSpecs);
    }
  };

  assignSpecs(root);

  Object.keys(specs).forEach(id => {
    const spec = specs[id];
    if (spec.isTruongToc) {
      const node = findByNodeId(root, id);
      if (node && isNodeLiving(node)) {
        const sons = getSons(node);
        let hasActiveSon = false;
        for (const son of sons) {
          if (isNodeLiving(son) || hasActiveLineageDescendant(son)) {
            hasActiveSon = true;
            break;
          }
        }

        if (!hasActiveSon) {
          const parent = parentMap[node.id];
          if (parent) {
            const youngerSeq = getSons(parent).slice(
              getSons(parent).findIndex(s => s.id === node.id) + 1
            );

            let chosenBrother: AncestorNode | null = null;
            let chosenBrotherEldestSon: AncestorNode | null = null;

            for (const b of youngerSeq) {
              const bSons = getSons(b);
              if (bSons.length > 0) {
                chosenBrother = b;
                chosenBrotherEldestSon = bSons[0];
                break;
              }
            }

            if (chosenBrother && chosenBrotherEldestSon) {
              specs[chosenBrother.id].dot = 'green';
              specs[chosenBrotherEldestSon.id].dot = 'blue';
            }
          }
        }
      }
    }
  });

  return specs;
};

export default function GiaPhaTree() {
  const [treeData, setTreeData] = React.useState<AncestorNode>(() => getPersistedTreeData(ANCESTRAL_TREE));
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedNode, setSelectedNode] = React.useState<AncestorNode | null>(null);
  const [showExactDates, setShowExactDates] = React.useState(false);
  const [showAnniversaryDetails, setShowAnniversaryDetails] = React.useState(false);
  const [collapsedNodes, setCollapsedNodes] = React.useState<Record<string, boolean>>({});

  // Loaded dynamic theme configurations
  const [settings, setSettings] = React.useState(getAppSettings());

  React.useEffect(() => {
    const handleConfigTrigger = () => {
      setSettings(getAppSettings());
    };
    const handleTreeTrigger = () => {
      setTreeData(getPersistedTreeData(ANCESTRAL_TREE));
    };
    window.addEventListener("caogia_settings_updated", handleConfigTrigger);
    window.addEventListener("caogia_tree_data_updated", handleTreeTrigger);
    return () => {
      window.removeEventListener("caogia_settings_updated", handleConfigTrigger);
      window.removeEventListener("caogia_tree_data_updated", handleTreeTrigger);
    };
  }, []);

  React.useEffect(() => {
    setShowExactDates(false);
    setShowAnniversaryDetails(false);
  }, [selectedNode?.id]);
  const [generationFilter, setGenerationFilter] = React.useState<number | 'all'>('all');
  
  // Interactive UI configurations
  const [zoomLevel, setZoomLevel] = React.useState<number>(100);
  const [orientation, setOrientation] = React.useState<'vertical' | 'horizontal'>('vertical');
  
  // Admin Mode protection (Only admin can modify tree on web)
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = React.useState('');
  const [showAdminLoginModal, setShowAdminLoginModal] = React.useState(false);
  const [adminLoginError, setAdminLoginError] = React.useState('');

  // Mobile viewport helper and popup modal trigger
  const [isMobile, setIsMobile] = React.useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = React.useState(false);

  const [clanLeaderRuleActive, setClanLeaderRuleActive] = React.useState(false);

  const leaderSpecsMap = React.useMemo(() => {
    if (!clanLeaderRuleActive) return {};
    return computeClanLeaderRules(treeData);
  }, [treeData, clanLeaderRuleActive]);

  // State for dynamic additions
  const [isAddingNode, setIsAddingNode] = React.useState(false);
  const [addType, setAddType] = React.useState<'child' | 'spouse' | 'edit' | 'edit_spouse'>('child');
  
  // Dragging state for desktop space dragging pan scroll
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [startY, setStartY] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);

  // Expanded status for spouses details
  const [expandedSpouseNames, setExpandedSpouseNames] = React.useState<Record<string, boolean>>({});

  const [newMemberName, setNewMemberName] = React.useState('');
  const [newMemberGender, setNewMemberGender] = React.useState<'nam' | 'nữ'>('nam');
  const [newMemberTitle, setNewMemberTitle] = React.useState('');
  const [newMemberRankRole, setNewMemberRankRole] = React.useState('');
  const [newMemberCustomSuffix, setNewMemberCustomSuffix] = React.useState('');
  const [newMemberBirthYear, setNewMemberBirthYear] = React.useState('');
  const [newMemberDeathYear, setNewMemberDeathYear] = React.useState('');
  const [newMemberDescription, setNewMemberDescription] = React.useState('');
  const [newMemberSpouse, setNewMemberSpouse] = React.useState('');
  const [newMemberMother, setNewMemberMother] = React.useState(''); // Mother reference field (multi-wife solution)
  const [newMemberResidence, setNewMemberResidence] = React.useState('');
  const [newMemberBurial, setNewMemberBurial] = React.useState('');
  const [newMemberLunarAnniversary, setNewMemberLunarAnniversary] = React.useState('');
  const [newMemberIsLiving, setNewMemberIsLiving] = React.useState(false);
  const [newMemberPhone1, setNewMemberPhone1] = React.useState('');
  const [newMemberPhone2, setNewMemberPhone2] = React.useState('');
  const [newMemberPhone3, setNewMemberPhone3] = React.useState('');
  const [newMemberBirthPlace, setNewMemberBirthPlace] = React.useState('');
  const [newMemberDeathPlace, setNewMemberDeathPlace] = React.useState('');
  const [newMemberEmail, setNewMemberEmail] = React.useState('');

  // Sơ đồ phối ngẫu mới thêm chi tiết
  const [spouseBirthYear, setSpouseBirthYear] = React.useState('');
  const [spouseDeathYear, setSpouseDeathYear] = React.useState('');
  const [spouseBirthPlace, setSpouseBirthPlace] = React.useState('');
  const [spouseDeathPlace, setSpouseDeathPlace] = React.useState('');
  const [spouseResidence, setSpouseResidence] = React.useState('');
  const [spouseLunarAnniversary, setSpouseLunarAnniversary] = React.useState('');
  const [spousePhone1, setSpousePhone1] = React.useState('');
  const [spousePhone2, setSpousePhone2] = React.useState('');
  const [spousePhone3, setSpousePhone3] = React.useState('');
  const [spouseEmail, setSpouseEmail] = React.useState('');
  const [spouseIsLiving, setSpouseIsLiving] = React.useState(false);
  const [editingSpouseOriginalName, setEditingSpouseOriginalName] = React.useState<string | null>(null);

  // Solar Date & automatic Lunar formatting states
  const [newMemberSolarBirthDate, setNewMemberSolarBirthDate] = React.useState('');
  const [newMemberSolarDeathDate, setNewMemberSolarDeathDate] = React.useState('');
  const [spouseSolarBirthDate, setSpouseSolarBirthDate] = React.useState('');
  const [spouseSolarDeathDate, setSpouseSolarDeathDate] = React.useState('');

  // Mouse pan event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('input') || 
      target.closest('button') || 
      target.closest('select') || 
      target.closest('textarea') || 
      target.closest('[id^="vt-node-card-"]') || 
      target.closest('[id^="hz-node-card-"]')
    ) {
      return;
    }
    if (viewportRef.current) {
      e.preventDefault(); // Ngăn hiển thị bôi đen chữ hoặc cơ chế kéo mặc định của trình duyệt để có thể giữ chuột trái kéo lướt mượt mà
      setIsDragging(true);
      setStartX(e.clientX - viewportRef.current.offsetLeft);
      setStartY(e.clientY - viewportRef.current.offsetTop);
      setScrollLeft(viewportRef.current.scrollLeft);
      setScrollTop(viewportRef.current.scrollTop);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !viewportRef.current) return;
    e.preventDefault();
    const x = e.clientX - viewportRef.current.offsetLeft;
    const y = e.clientY - viewportRef.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    viewportRef.current.scrollLeft = scrollLeft - walkX;
    viewportRef.current.scrollTop = scrollTop - walkY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Launching panels helpers
  const startAddChild = () => {
    setAddType('child');
    setNewMemberName('');
    setNewMemberGender('nam');
    setNewMemberTitle('Hậu duệ chi Cao Gia');
    setNewMemberRankRole('');
    setNewMemberCustomSuffix('');
    setNewMemberBirthYear('');
    setNewMemberDeathYear('');
    setNewMemberDescription('');
    setNewMemberSpouse('');
    setNewMemberMother('');
    setNewMemberResidence('');
    setNewMemberBurial('');
    setNewMemberLunarAnniversary('');
    setNewMemberIsLiving(false);
    setNewMemberPhone1('');
    setNewMemberPhone2('');
    setNewMemberPhone3('');
    setNewMemberBirthPlace('');
    setNewMemberDeathPlace('');
    setNewMemberSolarBirthDate('');
    setNewMemberSolarDeathDate('');
    setNewMemberEmail('');
    setSpouseEmail('');
    setIsAddingNode(true);
  };

  const startAddSpouse = () => {
    setAddType('spouse');
    setNewMemberSpouse('');
    setSpouseBirthYear('');
    setSpouseDeathYear('');
    setSpouseBirthPlace('');
    setSpouseDeathPlace('');
    setSpouseResidence('');
    setSpouseLunarAnniversary('');
    setSpousePhone1('');
    setSpousePhone2('');
    setSpousePhone3('');
    setSpouseIsLiving(false);
    setSpouseSolarBirthDate('');
    setSpouseSolarDeathDate('');
    setSpouseEmail('');
    setIsAddingNode(true);
  };

  const startEditSpouse = (spouseName: string, detail: any) => {
    setNewMemberSpouse(spouseName);
    setSpouseBirthYear(detail?.birthYear || '');
    setSpouseDeathYear(detail?.deathYear || '');
    setSpouseBirthPlace(detail?.birthPlace || '');
    setSpouseDeathPlace(detail?.deathPlace || '');
    setSpouseResidence(detail?.residence || '');
    setSpouseLunarAnniversary(detail?.lunarAnniversary || '');
    setSpousePhone1(detail?.phone1 || '');
    setSpousePhone2(detail?.phone2 || '');
    setSpousePhone3(detail?.phone3 || '');
    setSpouseIsLiving(detail ? !!detail.isLiving : false);
    setSpouseSolarBirthDate(detail?.solarBirthDate || '');
    setSpouseSolarDeathDate(detail?.solarDeathDate || '');
    setSpouseEmail(detail?.email || '');
    setEditingSpouseOriginalName(spouseName);
    setAddType('edit_spouse');
    setIsAddingNode(true);
  };

  const handleCancelAdd = () => {
    setIsAddingNode(false);
    setNewMemberSpouse('');
    setNewMemberRankRole('');
    setNewMemberCustomSuffix('');
    setSpouseBirthYear('');
    setSpouseDeathYear('');
    setSpouseBirthPlace('');
    setSpouseDeathPlace('');
    setSpouseResidence('');
    setSpouseLunarAnniversary('');
    setSpousePhone1('');
    setSpousePhone2('');
    setSpousePhone3('');
    setSpouseIsLiving(false);
    setSpouseSolarBirthDate('');
    setSpouseSolarDeathDate('');
    setSpouseEmail('');
    setEditingSpouseOriginalName(null);
  };

  const startEditing = () => {
    if (!selectedNode) return;
    setAddType('edit');
    setNewMemberName(selectedNode.name || '');
    setNewMemberGender(selectedNode.gender || 'nam');
    setNewMemberTitle(selectedNode.title || '');
    setNewMemberBirthYear(selectedNode.birthYear || '');
    setNewMemberDeathYear(selectedNode.deathYear || '');
    
    let rRole = selectedNode.rankRole || '';
    let cSuffix = selectedNode.customSuffix || '';
    if (!selectedNode.rankRole && selectedNode.title) {
      // Parse legacy
      let cleanTitle = selectedNode.title;
      cleanTitle = cleanTitle.replace(/^Đệ\s+[A-Za-zĂăÂâĐđÊêÔôƠơƯưỨứ\s]+\s+thế\s+tổ(?:\s*-\s*|\s+)?/gi, '');
      cleanTitle = cleanTitle.replace(/^Hậu\s+duệ\s+đời\s+\d+(?:\s*-\s*|\s+)?/gi, '');
      
      const roles = ["trưởng chi", "trưởng tộc", "đệ nhị", "đệ tam", "gái cả", "gái thứ 1-2-3", "gái thứ 1", "gái thứ 2", "gái thứ 3", "đích tôn"];
      const foundRole = roles.find(r => cleanTitle.toLowerCase().includes(r));
      if (foundRole) {
        const index = cleanTitle.toLowerCase().indexOf(foundRole);
        rRole = cleanTitle.substring(index, index + foundRole.length);
        const part1 = cleanTitle.substring(0, index).trim();
        const part2 = cleanTitle.substring(index + foundRole.length).trim();
        cSuffix = [part1, part2].filter(Boolean).join(' ').replace(/^\s*-\s*|\s*-\s*$/g, '').trim();
      } else {
        rRole = '';
        cSuffix = cleanTitle.trim();
      }
    }
    setNewMemberRankRole(rRole);
    setNewMemberCustomSuffix(cSuffix);

    setNewMemberDescription(selectedNode.description || '');
    setNewMemberSpouse(selectedNode.spouse || '');
    setNewMemberMother(selectedNode.motherName || '');
    setNewMemberResidence(selectedNode.residence || '');
    setNewMemberBurial(selectedNode.burialPlace || '');
    setNewMemberLunarAnniversary(selectedNode.lunarAnniversary || '');
    setNewMemberIsLiving(!!selectedNode.isLiving);
    setNewMemberPhone1(selectedNode.phone1 || '');
    setNewMemberPhone2(selectedNode.phone2 || '');
    setNewMemberPhone3(selectedNode.phone3 || '');
    setNewMemberBirthPlace(selectedNode.birthPlace || '');
    setNewMemberDeathPlace(selectedNode.deathPlace || '');
    setNewMemberSolarBirthDate(selectedNode.solarBirthDate || '');
    setNewMemberSolarDeathDate(selectedNode.solarDeathDate || '');
    setNewMemberEmail(selectedNode.email || '');
    setIsAddingNode(true);
  };

  // Responsive device checks
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Default selected node is the root ancestor
  React.useEffect(() => {
    if (!selectedNode) {
      setSelectedNode(treeData);
    }
  }, [selectedNode, treeData]);

  // Recursively gather all ancestors into a flat list for search and filtering
  const flatAncestors = React.useMemo(() => {
    const list: AncestorNode[] = [];
    const traverse = (node: AncestorNode) => {
      list.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(treeData);
    return list;
  }, [treeData]);

  // Dynamic lookup for selectedNode's mother details
  const motherDetail = React.useMemo(() => {
    if (!selectedNode || !selectedNode.parentId || !selectedNode.motherName) return null;
    const father = flatAncestors.find(a => a.id === selectedNode.parentId);
    if (!father || !father.spouseDetails) return null;
    const cleanMotherName = selectedNode.motherName.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
    return father.spouseDetails.find(d => {
      const dName = d.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
      return dName === cleanMotherName || dName.includes(cleanMotherName) || cleanMotherName.includes(dName);
    }) || null;
  }, [selectedNode, flatAncestors]);

  // Helper function to split a spouse string (e.g. comma-delimited or slash-delimited multi-spouse entries)
  const parseSpouses = (spouseStr?: string): string[] => {
    if (!spouseStr) return [];
    return spouseStr.split(/[,\/;\-\+]+/).map(s => s.trim()).filter(Boolean);
  };

  // Traverses and appends a child
  const handleAddChild = (parentId: string) => {
    if (!newMemberName.trim()) return;

    const traverseAndAdd = (node: AncestorNode): boolean => {
      if (node.id === parentId) {
        const nextGen = node.generation + 1;
        const compiledTitle = formatNodeTitle({
          generation: nextGen,
          isLiving: newMemberIsLiving,
          birthYear: newMemberBirthYear,
          deathYear: newMemberDeathYear,
          rankRole: newMemberRankRole,
          customSuffix: newMemberCustomSuffix
        });

        const newChild: AncestorNode = {
          id: `custom-gen-${Date.now()}`,
          name: newMemberName,
          generation: nextGen,
          parentId: parentId,
          title: compiledTitle,
          rankRole: newMemberRankRole,
          customSuffix: newMemberCustomSuffix,
          birthYear: newMemberBirthYear,
          deathYear: newMemberDeathYear,
          description: newMemberDescription || 'Đang cập nhật hành trạng gia phả.',
          spouse: newMemberSpouse,
          spouseList: newMemberSpouse ? parseSpouses(newMemberSpouse) : [],
          spouseDetails: newMemberSpouse ? [{
            name: newMemberSpouse,
            birthYear: spouseBirthYear,
            deathYear: spouseDeathYear,
            birthPlace: spouseBirthPlace,
            deathPlace: spouseDeathPlace,
            residence: spouseResidence,
            lunarAnniversary: spouseLunarAnniversary,
            phone1: spousePhone1,
            phone2: spousePhone2,
            phone3: spousePhone3,
            isLiving: spouseIsLiving,
            solarBirthDate: spouseSolarBirthDate,
            solarDeathDate: spouseSolarDeathDate,
            email: spouseEmail
          }] : [],
          motherName: newMemberMother,
          residence: newMemberResidence,
          burialPlace: newMemberBurial,
          lunarAnniversary: newMemberLunarAnniversary,
          isLiving: newMemberIsLiving,
          phone1: newMemberPhone1,
          phone2: newMemberPhone2,
          phone3: newMemberPhone3,
          birthPlace: newMemberBirthPlace,
          deathPlace: newMemberDeathPlace,
          solarBirthDate: newMemberSolarBirthDate,
          solarDeathDate: newMemberSolarDeathDate,
          email: newMemberEmail,
          gender: newMemberGender,
          children: []
        };
        if (!node.children) node.children = [];
        node.children.push(newChild);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverseAndAdd(child)) return true;
        }
      }
      return false;
    };

    const treeCopy = JSON.parse(JSON.stringify(treeData));
    traverseAndAdd(treeCopy);
    setTreeData(treeCopy);
    savePersistedTreeData(treeCopy);
    
    // Clear form and sync selection back
    setIsAddingNode(false);
    setNewMemberName('');
    setNewMemberTitle('');
    setNewMemberRankRole('');
    setNewMemberCustomSuffix('');
    setNewMemberBirthYear('');
    setNewMemberDeathYear('');
    setNewMemberDescription('');
    setNewMemberSpouse('');
    setNewMemberMother('');
    setNewMemberResidence('');
    setNewMemberBurial('');
    setNewMemberLunarAnniversary('');
    setNewMemberIsLiving(false);
    setNewMemberPhone1('');
    setNewMemberPhone2('');
    setNewMemberPhone3('');
    setNewMemberBirthPlace('');
    setNewMemberDeathPlace('');
    setNewMemberSolarBirthDate('');
    setNewMemberSolarDeathDate('');
    setNewMemberEmail('');
    setSpouseEmail('');
    
    // Auto focus the updated parent node to view children
    const findUpdatedNode = (node: AncestorNode): AncestorNode | null => {
      if (node.id === parentId) return node;
      if (node.children) {
        for (const child of node.children) {
          const res = findUpdatedNode(child);
          if (res) return res;
        }
      }
      return null;
    };
    const updatedAncestor = findUpdatedNode(treeCopy);
    if (updatedAncestor) setSelectedNode(updatedAncestor);
  };

  // Traverses and adds a spouse
  const handleAddSpouse = (nodeId: string) => {
    if (!newMemberSpouse.trim()) return;

    const traverseAndAddSpouse = (node: AncestorNode): boolean => {
      if (node.id === nodeId) {
        if (node.spouse) {
          node.spouse = `${node.spouse}, ${newMemberSpouse}`;
        } else {
          node.spouse = newMemberSpouse;
        }
        node.spouseList = parseSpouses(node.spouse);

        const newSpouseDetail = {
          name: newMemberSpouse,
          birthYear: spouseBirthYear,
          deathYear: spouseDeathYear,
          birthPlace: spouseBirthPlace,
          deathPlace: spouseDeathPlace,
          residence: spouseResidence,
          lunarAnniversary: spouseLunarAnniversary,
          phone1: spousePhone1,
          phone2: spousePhone2,
          phone3: spousePhone3,
          isLiving: spouseIsLiving,
          solarBirthDate: spouseSolarBirthDate,
          solarDeathDate: spouseSolarDeathDate,
          email: spouseEmail
        };

        if (!node.spouseDetails) node.spouseDetails = [];
        node.spouseDetails.push(newSpouseDetail);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverseAndAddSpouse(child)) return true;
        }
      }
      return false;
    };

    const treeCopy = JSON.parse(JSON.stringify(treeData));
    traverseAndAddSpouse(treeCopy);
    setTreeData(treeCopy);
    savePersistedTreeData(treeCopy);
    
    setIsAddingNode(false);
    setNewMemberSpouse('');
    setSpouseBirthYear('');
    setSpouseDeathYear('');
    setSpouseBirthPlace('');
    setSpouseDeathPlace('');
    setSpouseResidence('');
    setSpouseLunarAnniversary('');
    setSpousePhone1('');
    setSpousePhone2('');
    setSpousePhone3('');
    setSpouseIsLiving(false);
    setSpouseSolarBirthDate('');
    setSpouseSolarDeathDate('');
    setSpouseEmail('');
    
    const findUpdatedNode = (node: AncestorNode): AncestorNode | null => {
      if (node.id === nodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const res = findUpdatedNode(child);
          if (res) return res;
        }
      }
      return null;
    };
    const updatedAncestor = findUpdatedNode(treeCopy);
    if (updatedAncestor) setSelectedNode(updatedAncestor);
  };

  // Traverses and edits a spouse
  const handleEditSpouse = (nodeId: string) => {
    if (!newMemberSpouse.trim() || !editingSpouseOriginalName) return;

    const traverseAndEditSpouse = (node: AncestorNode): boolean => {
      if (node.id === nodeId) {
        // Update name in spouse list
        const spousesList = parseSpouses(node.spouse || '');
        const spouseIdx = spousesList.findIndex(s => s === editingSpouseOriginalName);
        if (spouseIdx !== -1) {
          spousesList[spouseIdx] = newMemberSpouse;
        }
        node.spouse = spousesList.join(', ');
        node.spouseList = spousesList;

        const updatedDetail = {
          name: newMemberSpouse,
          birthYear: spouseBirthYear,
          deathYear: spouseDeathYear,
          birthPlace: spouseBirthPlace,
          deathPlace: spouseDeathPlace,
          residence: spouseResidence,
          lunarAnniversary: spouseLunarAnniversary,
          phone1: spousePhone1,
          phone2: spousePhone2,
          phone3: spousePhone3,
          isLiving: spouseIsLiving,
          solarBirthDate: spouseSolarBirthDate,
          solarDeathDate: spouseSolarDeathDate,
          email: spouseEmail
        };

        if (!node.spouseDetails) node.spouseDetails = [];
        const detailIndex = node.spouseDetails.findIndex(d => {
          const dName = d.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
          const cleanOriginalName = editingSpouseOriginalName.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
          return dName === cleanOriginalName || dName.includes(cleanOriginalName) || cleanOriginalName.includes(dName);
        });

        if (detailIndex !== -1) {
          node.spouseDetails[detailIndex] = updatedDetail;
        } else {
          node.spouseDetails.push(updatedDetail);
        }
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverseAndEditSpouse(child)) return true;
        }
      }
      return false;
    };

    const treeCopy = JSON.parse(JSON.stringify(treeData));
    traverseAndEditSpouse(treeCopy);
    setTreeData(treeCopy);
    savePersistedTreeData(treeCopy);
    
    setIsAddingNode(false);
    setNewMemberSpouse('');
    setSpouseBirthYear('');
    setSpouseDeathYear('');
    setSpouseBirthPlace('');
    setSpouseDeathPlace('');
    setSpouseResidence('');
    setSpouseLunarAnniversary('');
    setSpousePhone1('');
    setSpousePhone2('');
    setSpousePhone3('');
    setSpouseIsLiving(false);
    setSpouseSolarBirthDate('');
    setSpouseSolarDeathDate('');
    setSpouseEmail('');
    setEditingSpouseOriginalName(null);
    
    const findUpdatedNode = (node: AncestorNode): AncestorNode | null => {
      if (node.id === nodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const res = findUpdatedNode(child);
          if (res) return res;
        }
      }
      return null;
    };
    const updatedAncestor = findUpdatedNode(treeCopy);
    if (updatedAncestor) setSelectedNode(updatedAncestor);
  };

  // Traverses and edits a node
  const handleEditNode = (nodeId: string) => {
    const traverseAndEdit = (node: AncestorNode): boolean => {
      if (node.id === nodeId) {
        node.name = newMemberName;
        node.rankRole = newMemberRankRole;
        node.customSuffix = newMemberCustomSuffix;
        node.title = formatNodeTitle({
          generation: node.generation,
          isLiving: newMemberIsLiving,
          birthYear: newMemberBirthYear,
          deathYear: newMemberDeathYear,
          rankRole: newMemberRankRole,
          customSuffix: newMemberCustomSuffix
        });
        node.birthYear = newMemberBirthYear;
        node.deathYear = newMemberDeathYear;
        node.birthPlace = newMemberBirthPlace;
        node.deathPlace = newMemberDeathPlace;
        node.description = newMemberDescription;
        node.residence = newMemberResidence;
        node.burialPlace = newMemberBurial;
        node.lunarAnniversary = newMemberLunarAnniversary;
        node.isLiving = newMemberIsLiving;
        node.phone1 = newMemberPhone1;
        node.phone2 = newMemberPhone2;
        node.phone3 = newMemberPhone3;
        node.solarBirthDate = newMemberSolarBirthDate;
        node.solarDeathDate = newMemberSolarDeathDate;
        node.email = newMemberEmail;
        node.gender = newMemberGender;
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (traverseAndEdit(child)) return true;
        }
      }
      return false;
    };

    const treeCopy = JSON.parse(JSON.stringify(treeData));
    traverseAndEdit(treeCopy);
    setTreeData(treeCopy);
    savePersistedTreeData(treeCopy);
    
    setIsAddingNode(false);
    
    const findUpdatedNode = (node: AncestorNode): AncestorNode | null => {
      if (node.id === nodeId) return node;
      if (node.children) {
        for (const child of node.children) {
          const res = findUpdatedNode(child);
          if (res) return res;
        }
      }
      return null;
    };
    const updatedAncestor = findUpdatedNode(treeCopy);
    if (updatedAncestor) setSelectedNode(updatedAncestor);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    if (addType === 'child') {
      handleAddChild(selectedNode.id);
    } else if (addType === 'spouse') {
      handleAddSpouse(selectedNode.id);
    } else if (addType === 'edit_spouse') {
      handleEditSpouse(selectedNode.id);
    } else if (addType === 'edit') {
      handleEditNode(selectedNode.id);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default password is empty/admin but provide automatic direct fast-pass bypass for developers
    if (adminPasswordInput.trim().toLowerCase() === 'admin' || !adminPasswordInput.trim()) {
      setIsAdmin(true);
      setShowAdminLoginModal(false);
      setAdminLoginError('');
      setAdminPasswordInput('');
    } else {
      setAdminLoginError('Sai mật mã định danh. Nhập "admin" hoặc bấm Xác Thực Nhanh để tiếp tục.');
    }
  };

  // Toggle Collapse on specific ancestor nodes
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Expand all nodes
  const handleExpandAll = () => {
    setCollapsedNodes({});
  };

  // Collapse all nodes except root
  const handleCollapseAll = () => {
    const list: Record<string, boolean> = {};
    const traverse = (node: AncestorNode) => {
      if (node.id !== treeData.id) {
        list[node.id] = true;
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(treeData);
    setCollapsedNodes(list);
  };

  // Dynamic search tracking highlight
  const isSearchMatched = (node: AncestorNode) => {
    if (!searchTerm) return false;
    return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (node.title && node.title.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  // RECURSIVE RENDERER FOR VERTICAL TREE DESCENDANT
  const renderVerticalNode = (node: AncestorNode): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;
    const matched = isSearchMatched(node);
    const spouses = parseSpouses(node.spouse);
    
    // Living state check: true if marked isLiving or if there is no year of death recorded
    const isLiving = node.isLiving || (!node.deathYear && node.birthYear && parseInt(node.birthYear) > 1920);

    const dynamicSpec = clanLeaderRuleActive ? leaderSpecsMap[node.id] : undefined;
    const formattedTitle = dynamicSpec 
      ? formatNodeTitle({
          generation: node.generation,
          isLiving: node.isLiving,
          birthYear: node.birthYear,
          deathYear: node.deathYear,
          rankRole: dynamicSpec.role,
          customSuffix: node.customSuffix
        })
      : formatNodeTitle(node);

    const titleLower = formattedTitle.toLowerCase();
    
    let isTruongToc = false;
    let isTruongNam = false;
    let isDichTon = false;

    if (clanLeaderRuleActive && dynamicSpec) {
      isTruongToc = dynamicSpec.role === 'Trưởng tộc';
      isTruongNam = dynamicSpec.role === 'Trưởng nam';
      isDichTon = dynamicSpec.role === 'Đích tôn';
    } else {
      isTruongToc = titleLower.includes('trưởng tộc');
      isTruongNam = titleLower.includes('trưởng nam');
      isDichTon = titleLower.includes('đích tôn');
    }

    // Dynamic borders and backgrounds
    let cardClasses = `transition-all duration-300 relative select-none cursor-pointer text-center border p-2.5 hover:shadow-md ${settings.nodeBorderRadius} `;
    if (isSelected) {
      cardClasses += "bg-primary text-silk-paper shadow-lg scale-105 z-20 ";
      if (isLiving) {
        if (isTruongToc) {
          cardClasses += "border-red-500 ring-2 ring-red-400/60 shadow-[0_0_12px_rgba(239,68,68,0.6)] ";
        } else if (isTruongNam) {
          cardClasses += "border-orange-500 ring-2 ring-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.6)] ";
        } else if (isDichTon) {
          cardClasses += "border-blue-500 ring-2 ring-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.6)] ";
        } else {
          cardClasses += "border-amber-400 ring-2 ring-amber-300/60 shadow-[0_0_12px_rgba(245,158,11,0.6)] ";
        }
      } else {
        if (isTruongToc) {
          cardClasses += "border-red-300/80 ring-1 ring-red-300/40 shadow-[0_0_8px_rgba(239,68,68,0.4)] ";
        } else if (isTruongNam) {
          cardClasses += "border-orange-300/80 ring-1 ring-orange-300/40 shadow-[0_0_8px_rgba(249,115,22,0.4)] ";
        } else {
          cardClasses += "border-primary ";
        }
      }
    } else {
      if (isLiving) {
        if (isTruongToc) {
          cardClasses += "bg-red-50/10 border-red-500 text-ink-charcoal shadow-[0_0_8px_rgba(239,68,68,0.25)] ring-1 ring-red-500/30 hover:bg-red-50/20 ";
        } else if (isTruongNam) {
          cardClasses += "bg-orange-50/10 border-orange-500 text-ink-charcoal shadow-[0_0_8px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/30 hover:bg-orange-50/20 ";
        } else if (isDichTon) {
          cardClasses += "bg-blue-50/10 border-blue-500 text-ink-charcoal shadow-[0_0_8px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/30 hover:bg-blue-50/20 ";
        } else {
          cardClasses += "bg-amber-50/10 border-amber-400 text-ink-charcoal shadow-[0_0_8px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30 hover:bg-amber-50/20 ";
        }
      } else {
        if (isTruongToc) {
          cardClasses += "bg-white border-red-200 text-ink-charcoal shadow-[0_0_6px_rgba(239,68,68,0.1)] hover:border-red-300/80 ";
        } else if (isTruongNam) {
          cardClasses += "bg-white border-orange-200 text-ink-charcoal shadow-[0_0_6px_rgba(249,115,22,0.1)] hover:border-orange-300/80 ";
        } else if (matched) {
          cardClasses += "bg-secondary/10 border-secondary text-primary shadow-sm hover:bg-secondary/20 ";
        } else {
          cardClasses += "bg-white border-[#8c716e]/25 text-ink-charcoal hover:border-primary/50 ";
        }
      }
    }

    const handleClickNode = () => {
      setSelectedNode(node);
      if (isMobile) {
        setIsMobileModalOpen(true);
      }
    };

    return (
      <div key={node.id} className="flex flex-col items-center relative" id={`vt-node-col-${node.id}`}>
        {/* Node visual card box container */}
        <div 
          onClick={handleClickNode}
          className={cardClasses}
          id={`vt-node-card-${node.id}`}
          style={{ width: isMobile ? '135px' : `${settings.treeNodeWidth}px` }}
        >
          {/* Tag indicating generation centered at the top */}
          <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-mono rounded-full px-2 py-0.5 font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border ${
            isSelected 
              ? 'bg-[#ffe4a4] border-amber-500 text-primary' 
              : 'bg-[#eeeee9] border-black/5 text-[#7b5800]'
          }`}>
            Đời {node.generation}
          </span>

          {clanLeaderRuleActive && dynamicSpec?.dot && (
            <span 
              className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 shadow-sm animate-pulse ${
                dynamicSpec.dot === 'green' 
                  ? 'bg-green-500 ring-green-300' 
                  : 'bg-blue-500 ring-blue-300'
              }`}
              title={dynamicSpec.dot === 'green' ? 'Người kế vị lâm thời (Dấu chấm xanh lá)' : 'Hậu duệ kế vị lâm thời (Dấu chấm xanh lam)'}
            />
          )}

          <div className="space-y-1 mt-1">
            {/* Full Name */}
            <h4 className={`font-serif text-[11px] md:text-[13px] font-bold tracking-tight line-clamp-1 leading-normal ${
              isSelected ? 'text-silk-paper' : 'text-primary'
            }`}>
              {node.name}
            </h4>
            
            {/* Title / Rank */}
            {formattedTitle && (
              <p className={`text-[8.5px] md:text-[9.5px] font-sans font-semibold tracking-wide uppercase line-clamp-1 ${
                isSelected ? 'text-silk-paper/85' : 'text-secondary'
              }`}>
                {formattedTitle}
              </p>
            )}

            {/* Birth/Death Year Correct Format (Sinh - Mất) */}
            <p className={`text-[8px] md:text-[9px] font-mono flex items-center justify-center space-x-0.5 ${
              isSelected ? 'text-silk-paper/70' : 'text-ink-charcoal/40'
            }`}>
              <Calendar className="w-2.5 h-2.5" />
              <span>
                {node.birthYear || '?'} – {isLiving ? 'Còn sống' : (node.deathYear || '?')}
              </span>
            </p>

            {/* Maternal Lineage Distinction: Clarifies multi-wife children relationship */}
            {node.motherName && (
              <div className={`text-[8px] font-sans italic border-t border-dotted mt-1.5 pt-1 flex items-center justify-center gap-0.5 ${
                isSelected ? 'text-silk-paper/60 border-silk-paper/25' : 'text-rose-950/70 border-ink-charcoal/10'
              }`} title={`Con của bà ${node.motherName}`}>
                <span className="font-semibold text-[8px] not-italic scale-90 px-0.5 bg-rose-50 border border-rose-100/50 rounded text-rose-800">Mẹ</span>
                <span className="line-clamp-1">{node.motherName.replace(/\(.*\)/, '').trim()}</span>
              </div>
            )}

            {/* Spouses overview indicators (Wives) */}
            {spouses.length > 0 && (
              <div className="flex flex-col gap-0.5 pt-1 mt-1 border-t border-dotted border-ink-charcoal/10 w-full text-left">
                {spouses.map((sp, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between text-[7.5px] md:text-[8px] w-full gap-1"
                  >
                    <span 
                      className={`inline-flex items-center space-x-0.5 truncate max-w-[65%] font-medium ${
                        isSelected ? 'text-silk-paper/90 animate-pulse' : 'text-rose-900'
                      }`}
                      title={sp}
                    >
                      <Heart className="w-1.5 h-1.5 text-rose-500 fill-rose-500 shrink-0" />
                      <span className="truncate">{sp.replace(/\(.*\)/, '').trim()}</span>
                    </span>
                    <span 
                      className={`text-[6.5px] md:text-[7px] font-mono leading-none shrink-0 border rounded px-0.5 scale-90 ${
                        isSelected 
                          ? 'bg-silk-paper/20 border-silk-paper/30 text-silk-paper font-semibold' 
                          : 'bg-rose-100/50 border-rose-200/50 text-rose-850 font-semibold'
                      }`}
                    >
                      {node.gender === 'nữ' ? (spouses.length <= 1 ? 'Chồng' : (idx === 0 ? 'Chồng đầu' : 'Chồng thứ')) : (idx === 0 ? 'Chính thất' : idx === 1 ? 'Thứ thất' : `Cung thất`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expand/Collapse controller button */}
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className={`absolute -bottom-2 right-1 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 w-4.5 h-4.5 rounded-full border flex items-center justify-center shadow-md transition-colors ${
                isSelected 
                  ? 'bg-secondary border-primary text-silk-paper' 
                  : 'bg-white border-[#8c716e]/20 text-secondary hover:bg-silk-paper'
              }`}
            >
              {isCollapsed ? <ChevronRight className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          )}
        </div>

        {/* Connector lines to children dynamically rendered via relative position elements */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full" id={`vt-node-branches-${node.id}`}>
            {/* Split parent bottom vertical node line */}
            <div className="h-5" style={{ width: `${settings.treeLineThickness}px`, backgroundColor: settings.treeLineColor, opacity: 0.25 }}></div>

            {/* Horizontal line row container */}
            <div className="flex justify-center relative w-full pt-3">
              {node.children!.map((child, idx) => {
                const totalKids = node.children!.length;
                return (
                  <div key={child.id} className="relative flex flex-col items-center" style={{ minWidth: isMobile ? '140px' : `${settings.treeSpacingX}px` }}>
                    
                    {/* Horizontal link spanning across children */}
                    {totalKids > 1 && (
                      <div 
                        className={`absolute top-0 ${
                          idx === 0 
                            ? 'right-0 left-1/2' 
                            : idx === totalKids - 1 
                              ? 'left-0 right-1/2' 
                              : 'left-0 right-0'
                        }`} 
                        style={{ height: `${settings.treeLineThickness}px`, backgroundColor: settings.treeLineColor, opacity: 0.25 }}
                      />
                    )}

                    {/* Small vertical link coming from above into each child card top */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-3" style={{ width: `${settings.treeLineThickness}px`, backgroundColor: settings.treeLineColor, opacity: 0.25 }}></div>

                    {/* Recursive tree call */}
                    {renderVerticalNode(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // RECURSIVE RENDERER FOR HORIZONTAL LINEAGE NAVIGATION
  const renderHorizontalNode = (node: AncestorNode): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;
    const matched = isSearchMatched(node);
    const spouses = parseSpouses(node.spouse);

    // Living state check: true if marked isLiving or if there is no year of death recorded
    const isLiving = node.isLiving || (!node.deathYear && node.birthYear && parseInt(node.birthYear) > 1920);

    const dynamicSpec = clanLeaderRuleActive ? leaderSpecsMap[node.id] : undefined;
    const formattedTitle = dynamicSpec 
      ? formatNodeTitle({
          generation: node.generation,
          isLiving: node.isLiving,
          birthYear: node.birthYear,
          deathYear: node.deathYear,
          rankRole: dynamicSpec.role,
          customSuffix: node.customSuffix
        })
      : formatNodeTitle(node);

    const titleLower = formattedTitle.toLowerCase();
    
    let isTruongToc = false;
    let isTruongNam = false;
    let isDichTon = false;

    if (clanLeaderRuleActive && dynamicSpec) {
      isTruongToc = dynamicSpec.role === 'Trưởng tộc';
      isTruongNam = dynamicSpec.role === 'Trưởng nam';
      isDichTon = dynamicSpec.role === 'Đích tôn';
    } else {
      isTruongToc = titleLower.includes('trưởng tộc');
      isTruongNam = titleLower.includes('trưởng nam');
      isDichTon = titleLower.includes('đích tôn');
    }

    // Dynamic borders and backgrounds
    let cardClasses = "transition-all duration-300 relative select-none cursor-pointer rounded-md border p-2.5 w-[140px] md:w-[165px] hover:shadow-md ";
    if (isSelected) {
      cardClasses += "bg-primary text-silk-paper shadow-lg scale-105 z-20 ";
      if (isLiving) {
        if (isTruongToc) {
          cardClasses += "border-red-500 ring-2 ring-red-400/60 shadow-[0_0_12px_rgba(239,68,68,0.6)] ";
        } else if (isTruongNam) {
          cardClasses += "border-orange-500 ring-2 ring-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.6)] ";
        } else if (isDichTon) {
          cardClasses += "border-blue-500 ring-2 ring-blue-400/60 shadow-[0_0_12px_rgba(59,130,246,0.6)] ";
        } else {
          cardClasses += "border-amber-400 ring-2 ring-amber-300/60 shadow-[0_0_12px_rgba(245,158,11,0.6)] ";
        }
      } else {
        if (isTruongToc) {
          cardClasses += "border-red-300/80 ring-1 ring-red-300/40 shadow-[0_0_8px_rgba(239,68,68,0.4)] ";
        } else if (isTruongNam) {
          cardClasses += "border-orange-300/80 ring-1 ring-orange-300/40 shadow-[0_0_8px_rgba(249,115,22,0.4)] ";
        } else {
          cardClasses += "border-primary ";
        }
      }
    } else {
      if (isLiving) {
        if (isTruongToc) {
          cardClasses += "bg-red-50/10 border-red-500 text-ink-charcoal shadow-[0_0_8px_rgba(239,68,68,0.25)] ring-1 ring-red-500/30 hover:bg-red-50/20 ";
        } else if (isTruongNam) {
          cardClasses += "bg-orange-50/10 border-orange-500 text-ink-charcoal shadow-[0_0_8px_rgba(249,115,22,0.25)] ring-1 ring-orange-500/30 hover:bg-orange-50/20 ";
        } else if (isDichTon) {
          cardClasses += "bg-blue-50/10 border-blue-500 text-ink-charcoal shadow-[0_0_8px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/30 hover:bg-blue-50/20 ";
        } else {
          cardClasses += "bg-amber-50/10 border-amber-400 text-ink-charcoal shadow-[0_0_8px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30 hover:bg-amber-50/20 ";
        }
      } else {
        if (isTruongToc) {
          cardClasses += "bg-white border-red-200 text-ink-charcoal shadow-[0_0_6px_rgba(239,68,68,0.1)] hover:border-red-300/80 ";
        } else if (isTruongNam) {
          cardClasses += "bg-white border-orange-200 text-ink-charcoal shadow-[0_0_6px_rgba(249,115,22,0.1)] hover:border-orange-300/80 ";
        } else if (matched) {
          cardClasses += "bg-secondary/10 border-secondary text-primary shadow-sm hover:bg-secondary/20 ";
        } else {
          cardClasses += "bg-white border-[#8c716e]/25 text-ink-charcoal hover:border-primary/50 ";
        }
      }
    }

    const handleClickNode = () => {
      setSelectedNode(node);
      if (isMobile) {
        setIsMobileModalOpen(true);
      }
    };

    return (
      <div key={node.id} className="flex items-center relative py-2" id={`hz-node-row-${node.id}`}>
        {/* Node card */}
        <div 
          onClick={handleClickNode}
          className={cardClasses}
          id={`hz-node-card-${node.id}`}
        >
          {/* Tag indicating generation centered at top of card */}
          <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-mono rounded-full px-2 py-0.5 font-bold uppercase tracking-wider whitespace-nowrap shadow-sm border ${
            isSelected 
              ? 'bg-[#ffe4a4] border-amber-500 text-primary' 
              : 'bg-[#eeeee9] border-black/5 text-[#7b5800]'
          }`}>
            Đời {node.generation}
          </span>

          {clanLeaderRuleActive && dynamicSpec?.dot && (
            <span 
              className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 shadow-sm animate-pulse ${
                dynamicSpec.dot === 'green' 
                  ? 'bg-green-500 ring-green-300' 
                  : 'bg-blue-500 ring-blue-300'
              }`}
              title={dynamicSpec.dot === 'green' ? 'Người kế vị lâm thời (Dấu chấm xanh lá)' : 'Hậu duệ kế vị lâm thời (Dấu chấm xanh lam)'}
            />
          )}

          <div className="space-y-1 mt-1 text-left">
            <h4 className={`font-serif text-[11px] md:text-[13px] font-bold tracking-tight line-clamp-1 leading-normal ${isSelected ? 'text-silk-paper' : 'text-primary'}`}>
              {node.name}
            </h4>
            
            {formattedTitle && (
              <p className={`text-[8.5px] md:text-[9.5px] font-sans font-semibold uppercase line-clamp-1 ${
                isSelected ? 'text-silk-paper/85' : 'text-secondary'
              }`}>
                {formattedTitle}
              </p>
            )}

            <p className={`text-[8px] md:text-[9px] font-mono flex items-center space-x-0.5 ${
              isSelected ? 'text-silk-paper/70' : 'text-ink-charcoal/40'
            }`}>
              <Calendar className="w-2.5 h-2.5 border-none" />
              <span>
                {node.birthYear || '?'} – {isLiving ? 'Còn sống' : (node.deathYear || '?')}
              </span>
            </p>

            {/* Maternal distinction details */}
            {node.motherName && (
              <div className={`text-[8px] font-sans italic border-t border-dotted mt-1 pt-1 flex items-center gap-0.5 ${
                isSelected ? 'text-silk-paper/60 border-silk-paper/25' : 'text-rose-950/70 border-ink-charcoal/10'
              }`} title={`Con của bà ${node.motherName}`}>
                <span className="font-semibold text-[8px] scale-90 px-0.5 bg-rose-50 border border-rose-100/50 rounded text-rose-800">Mẹ</span>
                <span className="line-clamp-1">{node.motherName.replace(/\(.*\)/, '').trim()}</span>
              </div>
            )}

            {/* Spouses overview indicators */}
            {spouses.length > 0 && (
              <div className="flex flex-col gap-0.5 pt-1 mt-1 border-t border-dotted border-ink-charcoal/10 w-full text-left">
                {spouses.map((sp, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between text-[7.5px] md:text-[8px] w-full gap-1"
                  >
                    <span 
                      className={`inline-flex items-center space-x-0.5 truncate max-w-[65%] font-medium ${
                        isSelected ? 'text-silk-paper/90' : 'text-rose-900'
                      }`}
                      title={sp}
                    >
                      <Heart className="w-1.5 h-1.5 text-rose-500 fill-rose-500 shrink-0" />
                      <span className="truncate">{sp.replace(/\(.*\)/, '').trim()}</span>
                    </span>
                    <span 
                      className={`text-[6.5px] md:text-[7px] font-mono leading-none shrink-0 border rounded px-0.5 scale-90 ${
                        isSelected 
                          ? 'bg-silk-paper/20 border-silk-paper/30 text-silk-paper font-semibold' 
                          : 'bg-rose-100/50 border-rose-200/50 text-rose-850 font-semibold'
                      }`}
                    >
                      {node.gender === 'nữ' ? (spouses.length <= 1 ? 'Chồng' : (idx === 0 ? 'Chồng đầu' : 'Chồng thứ')) : (idx === 0 ? 'Chính thất' : idx === 1 ? 'Thứ thất' : `Cung thất`)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collapse switch on horizontal edge */}
          {hasChildren && (
            <button
              onClick={(e) => toggleCollapse(node.id, e)}
              className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full border flex items-center justify-center shadow-md transition-colors ${
                isSelected 
                  ? 'bg-secondary border-primary text-silk-paper font-bold' 
                  : 'bg-white border-[#8c716e]/20 text-secondary hover:bg-silk-paper'
              }`}
            >
              {isCollapsed ? <ChevronRight className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            </button>
          )}
        </div>

        {/* Split connector paths into descendant child column list */}
        {hasChildren && !isCollapsed && (
          <div className="flex items-center" id={`hz-node-branches-${node.id}`}>
            {/* Outgoing horizontal line from current parent card right to grandchildren column */}
            <div className="w-4" style={{ height: `${settings.treeLineThickness}px`, backgroundColor: settings.treeLineColor, opacity: 0.25 }}></div>

            {/* Vertical column organizing siblings stacked vertically */}
            <div className="flex flex-col relative pl-3 space-y-2" style={{ borderLeft: `${settings.treeLineThickness}px solid ${settings.treeLineColor}44` }}>
              {node.children!.map((child, idx) => {
                return (
                  <div key={child.id} className="relative flex items-center">
                    {/* Tiny branch horizontal entering arrow into each child */}
                    <div className="absolute top-1/2 -left-3 w-3" style={{ height: `${settings.treeLineThickness}px`, backgroundColor: settings.treeLineColor, opacity: 0.25 }}></div>
                    {renderHorizontalNode(child)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const selectedNodeIsLiving = selectedNode
    ? (selectedNode.isLiving || (!selectedNode.deathYear && selectedNode.birthYear && parseInt(selectedNode.birthYear) > 1920))
    : false;
  const anniversaryInfo = (selectedNode && !selectedNodeIsLiving && selectedNode.lunarAnniversary)
    ? getAnniversaryCountdown(selectedNode.lunarAnniversary)
    : null;

  return (
    <div className="space-y-8 animate-fade-in" id="giapha-root-box">
      {/* Editorial Top Line and Filter actions */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-[#8c716e]/10 pb-6">
        <div className="space-y-1">
          <span className="text-[11px] font-mono tracking-widest text-[#7b5800] uppercase block">Phả đồ hệ thống</span>
          <h1 className="font-serif text-3xl font-bold text-primary">Sơ đồ phả hệ chi họ Cao</h1>
          <p className="text-xs text-ink-charcoal/60 font-sans">
            Bản phả đồ chi tiết từ Thủy tổ Đại gia tộc ghi chép đầy đủ mối phối ngẫu chính thất và phân chi muôn phương.
          </p>
        </div>

        {/* Utility action dashboard */}
        <div className="flex flex-wrap items-center gap-3" id="tree-utility-bar">
          {/* Zoom buttons */}
          <div className="bg-white border border-[#8c716e]/20 rounded p-1 flex items-center space-x-1 shadow-sm">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
              className="p-1.5 hover:bg-[#eeeee9] rounded text-ink-charcoal/75 text-xs font-semibold flex items-center"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono px-2 font-bold text-[#7b5800] min-w-[40px] text-center">
              {zoomLevel}%
            </span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="p-1.5 hover:bg-[#eeeee9] rounded text-ink-charcoal/75"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setZoomLevel(100)}
              className="p-1.5 hover:bg-[#eeeee9] rounded text-ink-charcoal/50 hover:text-primary"
              title="Mặc định"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Orientation switch */}
          <div className="bg-white border border-[#8c716e]/20 rounded p-1 flex items-center shadow-sm">
            <button
              onClick={() => setOrientation('vertical')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-sm transition-all ${
                orientation === 'vertical'
                  ? 'bg-primary text-silk-paper font-semibold'
                  : 'text-ink-charcoal/60 hover:text-primary'
              }`}
            >
              Sơ đồ đứng
            </button>
            <button
              onClick={() => setOrientation('horizontal')}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded-sm transition-all ${
                orientation === 'horizontal'
                  ? 'bg-primary text-silk-paper font-semibold'
                  : 'text-ink-charcoal/60 hover:text-primary'
              }`}
            >
              Sơ đồ ngang
            </button>
          </div>

          {/* Global expand controls */}
          <div className="flex gap-1">
            <button
              onClick={handleExpandAll}
              className="px-3 py-1.5 bg-white border border-[#8c716e]/20 hover:border-primary text-ink-charcoal/70 hover:text-primary text-[11px] font-sans rounded shadow-sm"
              title="Mở toàn nhánh"
            >
              Mở hết
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-3 py-1.5 bg-white border border-[#8c716e]/20 hover:border-primary text-ink-charcoal/70 hover:text-primary text-[11px] font-sans rounded shadow-sm"
              title="Gọn sơ đồ"
            >
              Đóng hết
            </button>
          </div>

          {/* Admin Mode Lock Switch */}
          <button
            onClick={() => {
              if (isAdmin) {
                setIsAdmin(false);
                setClanLeaderRuleActive(false);
              } else {
                setShowAdminLoginModal(true);
              }
            }}
            className={`px-3 py-1.5 text-xs font-sans font-medium rounded shadow-sm transition-all border flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'bg-white border-[#8c716e]/20 hover:border-[#8b1c1c] text-ink-charcoal hover:text-[#8b1c1c]'
            }`}
          >
            {isAdmin ? <Unlock className="w-3.5 h-3.5 text-amber-700" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdmin ? 'Quyền Admin: Bật 🔓' : 'Kích hoạt Admin 🔐'}</span>
          </button>

          {/* Clan Leader Rule Toggle - Only visible when Admin is active */}
          {isAdmin && (
            <button
              onClick={() => setClanLeaderRuleActive(prev => !prev)}
              className={`px-3 py-1.5 text-xs font-sans font-medium rounded shadow-sm transition-all border flex items-center gap-1.5 animate-pulse ${
                clanLeaderRuleActive
                  ? 'bg-emerald-600 border-emerald-700 text-white font-extrabold shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-amber-100 border-amber-400 text-amber-950 font-bold hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-900 shadow-md ring-2 ring-amber-300/50'
              }`}
              title="Kích hoạt thuật toán tự động phân giải Trưởng tộc, Trưởng nam và Đích tôn"
            >
              <Award className={`w-3.5 h-3.5 ${clanLeaderRuleActive ? 'text-amber-300 animate-bounce' : 'text-amber-600'}`} />
              <span>{clanLeaderRuleActive ? 'Kế thừa Gia tộc: BẬT 👑' : 'Kích hoạt "Kế thừa Gia tộc" ⚙️'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Grid: Render panel with Scroll Canvas on Left, biography detailed worksheet on Right */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Visual responsive Scroll-box parent canvas */}
        <div className="xl:col-span-8 bg-[#fafaf5] shadow-inner rounded-sm p-4 relative border border-[#8c716e]/10" style={{ minHeight: '580px' }}>
          
          {/* Subtle watermark overlay layout background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-primary select-none pointer-events-none text-[220px] font-serif font-black">
            高
          </div>

          {/* Top-bar indicators */}
          <div className="flex justify-between items-center mb-6 relative z-10 text-[10px] font-mono text-[#7b5800] bg-white/70 p-2.5 rounded border border-ink-charcoal/5">
            <div className="flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span>Bấm click chọn cụ tổ/con cháu để mở tiểu sử chiêu bái</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-primary/10 border border-primary rounded-sm inline-block"></span>
                <span>Thế hệ dực bái</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-rose-50 border border-rose-100 rounded-sm inline-block"></span>
                <span>Phối ngẫu (Vợ / Chồng)</span>
              </span>
            </div>
          </div>

          {/* Search dynamic filter input inside canvas */}
          <div className="mb-4 relative z-10 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-charcoal/40" />
            <input
              type="text"
              placeholder="Nhập tên cụ tổ, năm sinh để rực bái vọng trích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#8c716e]/20 rounded-md pl-9 pr-4 py-2 text-xs w-full focus:outline-none focus:border-primary text-ink-charcoal placeholder-ink-charcoal/40"
              id="inside-search-tree"
            />
          </div>

          {/* TREE CANVAS PORT - SCROLLABLE PANEL */}
          <div 
            ref={viewportRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`overflow-auto w-full max-h-[640px] pb-10 scrollbar-thin ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            id="tree-viewport-canvas"
          >
            <div 
              className="origin-top-left transition-transform duration-200 py-6"
              style={{ 
                transform: `scale(${zoomLevel / 100})`, 
                width: orientation === 'vertical' ? 'max-content' : 'max-content',
                minWidth: '100%' 
              }}
            >
              {orientation === 'vertical' ? (
                // Classical vertical centered tree
                <div className="flex justify-center w-full px-6">
                  {renderVerticalNode(treeData)}
                </div>
              ) : (
                // Left-to-right horizontal lineage branches
                <div className="flex justify-start px-8">
                  {renderHorizontalNode(treeData)}
                </div>
              )}
            </div>
          </div>

          {/* Handcrafted Bottom instruction tip banner with high contrast definition */}
          <div className="mt-5 bg-amber-50 border-2 border-amber-500/35 rounded-lg p-3 text-[11.5px] font-sans text-amber-950 flex items-center gap-2.5 shadow-sm">
            <span className="shrink-0 bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider">Lưu Ý</span>
            <span className="font-medium text-amber-900">
              💡 <strong>Kéo giữ chuột trái</strong> (trên máy tính) hoặc <strong>vuốt ngón tay vào khoảng trống</strong> (trên điện thoại) để di chuyển, chiêm bái các phân chi nhánh rẽ gia phả rộng lớn. Thu nhỏ/phóng to bằng thanh điều khiển phía trên.
            </span>
          </div>
        </div>

        {/* Biography detailed worksheet panel and Live modification form on Right */}
        <div className="xl:col-span-4 space-y-6" id="right-biography-sheet">
          {selectedNode ? (
            <div className="bg-[#fafaf5] rounded-sm border border-[#7b5800]/20 p-6 shadow-md space-y-6 relative overflow-hidden" id="tree-authoritative-profile">
              
              {/* Top background corner tag for elegance */}
              <div className="absolute top-0 right-0 py-1.5 px-3 bg-primary text-silk-paper text-[10px] font-mono font-bold rounded-bl uppercase tracking-widest">
                ĐỜI {selectedNode.generation}
              </div>

              {/* Bio primary headings */}
              <div className="space-y-2 pb-4 border-b border-[#8c716e]/20">
                <span className="text-[10px] font-mono text-[#7b5800] tracking-widest uppercase block font-semibold flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 animate-pulse" />
                  <span>Xác thực gia phả</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl font-bold text-primary">
                    {selectedNode.name}
                  </h2>
                </div>
                
                {formatNodeTitle(selectedNode) && (
                  <p className="text-xs font-sans font-bold text-[#7b5800] tracking-wide uppercase">
                    {clanLeaderRuleActive && leaderSpecsMap[selectedNode.id] 
                      ? formatNodeTitle({
                          generation: selectedNode.generation,
                          isLiving: selectedNode.isLiving,
                          birthYear: selectedNode.birthYear,
                          deathYear: selectedNode.deathYear,
                          rankRole: leaderSpecsMap[selectedNode.id].role,
                          customSuffix: selectedNode.customSuffix
                        })
                      : formatNodeTitle(selectedNode)}
                  </p>
                )}

                {/* Giỗ năm nay directly below title / text.xs */}
                {anniversaryInfo && (
                  <div className="pt-2.5 text-xs font-sans text-ink-charcoal/85 space-y-1 block border-t border-[#8c716e]/10 mt-2" id="anniversary-bio-banner">
                    {anniversaryInfo.daysLeft > 0 ? (
                      <>
                        <div className="text-[12px] font-medium text-rose-950">
                          Giỗ năm nay: <span className="font-semibold text-rose-900">{anniversaryInfo.solarDateStr} ({anniversaryInfo.dayOfWeek})</span>
                        </div>
                        <div className="text-rose-800 text-[11px] font-medium italic">
                          (Còn {anniversaryInfo.daysLeft} ngày nữa)
                        </div>
                      </>
                    ) : anniversaryInfo.isToday ? (
                      <>
                        <div className="text-[12px] font-medium text-rose-950">
                          Giỗ năm nay: <span className="font-semibold text-rose-900">{anniversaryInfo.solarDateStr} ({anniversaryInfo.dayOfWeek})</span>
                        </div>
                        <div className="text-rose-700 font-bold animate-pulse text-[11.5px] uppercase tracking-wide">
                          (Hôm nay chính sự ngày giỗ!)
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-[12px] font-medium text-rose-950">
                          Giỗ năm nay: <span className="font-semibold text-ink-charcoal/70">{anniversaryInfo.solarDateStr} ({anniversaryInfo.dayOfWeek})</span>
                        </div>
                        <div className="text-ink-charcoal/50 italic text-[11px]">
                          (Đã qua {Math.abs(anniversaryInfo.daysLeft)} ngày)
                        </div>
                        <div className="text-[12px] pt-1 border-t border-black/[0.03] mt-1 space-y-0.5">
                          <div>
                            Giỗ tiếp theo: <span className="font-semibold text-rose-900">{anniversaryInfo.nextSolarDateStr} ({anniversaryInfo.nextDayOfWeek})</span>
                          </div>
                          <div className="text-rose-800/80 text-[11px] font-medium italic">
                            (còn {anniversaryInfo.nextDaysLeft} ngày)
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Swapped Year of Birth and Death list + Lunar death anniversary */}
              {/* Swapped Year of Birth and Death list + Lunar death anniversary */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-ink-charcoal/40 font-mono tracking-widest uppercase">Trích lục hành trạng chi tiết</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                  
                  {/* Birth - Death */}
                  <div 
                    onClick={() => setShowExactDates(!showExactDates)}
                    className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-1.5 cursor-pointer hover:bg-amber-50/40 hover:border-amber-200/50 transition-all select-none col-span-1"
                  >
                    <div>
                      <span className="block text-ink-charcoal/40 text-[9px] font-mono uppercase tracking-wider">Sinh thời & Tạ thế</span>
                    </div>
                    <div className="font-semibold text-primary flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-[#7b5800]" />
                      <span>
                        {(selectedNode.isLiving || (!selectedNode.deathYear && selectedNode.birthYear && parseInt(selectedNode.birthYear) > 1920)) 
                          ? `${selectedNode.birthYear || '?'}` 
                          : `${selectedNode.birthYear || '?'} – ${selectedNode.deathYear || '?'}`}
                      </span>
                    </div>

                    <div className="flex items-center text-[8.5px] text-[#7b5800] hover:underline font-mono font-bold pt-0.5">
                      <span>{showExactDates ? "▲ Thu gọn" : "▼ Xem chi tiết"}</span>
                    </div>
                  </div>

                  {/* Lunar death date */}
                  <div 
                    onClick={() => setShowAnniversaryDetails(!showAnniversaryDetails)}
                    className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-1.5 cursor-pointer hover:bg-rose-50/40 hover:border-rose-200/50 transition-all select-none col-span-1"
                  >
                    <div>
                      <span className="block text-rose-950/40 text-[9px] font-mono uppercase tracking-wider">Kỵ nhật (Âm lịch)</span>
                    </div>
                    <div className="font-semibold text-rose-950 flex items-center space-x-1">
                      <Scroll className="w-3.5 h-3.5 text-rose-700" />
                      <span className="truncate">{selectedNode.lunarAnniversary || 'Chưa khảo cứu'}</span>
                    </div>
                    <div className="flex items-center text-[8.5px] text-rose-800 hover:underline font-mono font-bold pt-0.5">
                      <span>{showAnniversaryDetails ? "▲ Thu gọn" : "▼ Xem chi tiết"}</span>
                    </div>
                  </div>

                  {/* Show exact dates detailed panel below */}
                  {showExactDates && (
                    <div className="bg-rose-50/50 p-3.5 rounded border border-rose-100/50 text-[11px] text-rose-950 space-y-3 col-span-1 md:col-span-2 shadow-sm animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <span className="block text-[8px] font-mono text-rose-950/60 uppercase tracking-wide">Chi tiết Ngày sinh:</span>
                          <span className="font-semibold block text-xs text-primary bg-white/70 px-2 py-1 rounded inline-block border border-rose-100/30">
                            {selectedNode.solarBirthDate ? `${selectedNode.solarBirthDate} (Dương lịch)` : "Chưa cập nhật ngày dương lịch"}
                          </span>
                          {selectedNode.solarBirthDate && convertSolarToLunarText(selectedNode.solarBirthDate) ? (
                            <div className="text-[10px] text-[#7b5800] bg-amber-50/80 border border-amber-100 px-2 py-1 rounded-sm mt-1 font-medium inline-block w-full">
                              Quy đổi Âm lịch: <strong>{convertSolarToLunarText(selectedNode.solarBirthDate)}</strong>
                            </div>
                          ) : null}
                        </div>

                        {!selectedNode.isLiving && (
                          <div className="space-y-1 text-left">
                            <span className="block text-[8px] font-mono text-rose-950/60 uppercase tracking-wide">Chi tiết Ngày mất:</span>
                            <span className="font-semibold block text-xs text-primary bg-white/70 px-2 py-1 rounded inline-block border border-rose-100/30">
                              {selectedNode.solarDeathDate ? `${selectedNode.solarDeathDate} (Dương lịch)` : "Chưa cập nhật ngày dương lịch"}
                            </span>
                            {selectedNode.solarDeathDate && convertSolarToLunarText(selectedNode.solarDeathDate) ? (
                              <div className="text-[10px] text-rose-950 bg-rose-100/40 border border-rose-200/30 px-2 py-1 rounded-sm mt-1 font-medium inline-block w-full">
                                Quy đổi Âm lịch: <strong>{convertSolarToLunarText(selectedNode.solarDeathDate)}</strong>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Show anniversary detailed panel below */}
                  {showAnniversaryDetails && !selectedNode.isLiving && selectedNode.lunarAnniversary && (
                    <div className="bg-rose-50/40 p-4 rounded border border-rose-100/50 text-[11px] text-rose-950 space-y-2 col-span-1 md:col-span-2 shadow-sm animate-fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-rose-800 uppercase tracking-widest text-[9px] font-mono border-b border-rose-150 pb-1.5 mb-2">
                        <Scroll className="w-3.5 h-3.5 text-rose-700 shadow-none" />
                        Chi tiết Kỷ nhật (Ngày giỗ năm nay)
                      </div>
                      {(() => {
                        const info = getAnniversaryCountdown(selectedNode.lunarAnniversary);
                        if (!info) return <span className="text-rose-950/50">Chưa thể xác định kỵ nhật năm nay</span>;
                        return (
                          <div className="space-y-2 text-xs text-rose-950 leading-relaxed font-sans">
                            <div className="font-semibold">
                              Giỗ năm nay: <span className="text-rose-900 font-bold">{info.solarDateStr} ({info.dayOfWeek})</span>
                            </div>
                            <div className="font-medium text-[11.5px]">
                              {info.isToday ? (
                                <span className="text-emerald-700 font-bold uppercase tracking-wider">★ Ngày hôm nay chính kỵ (Húy kỵ Đại giỗ)</span>
                              ) : info.daysLeft > 0 ? (
                                <span className="text-rose-800 italic">(Còn {info.daysLeft} ngày nữa)</span>
                              ) : (
                                <div className="space-y-1.5">
                                  <div className="text-ink-charcoal/50 italic">(Đã qua {Math.abs(info.daysLeft)} ngày)</div>
                                  {info.nextSolarDateStr && (
                                    <div className="pt-2 border-t border-[#8c716e]/10 mt-2 text-[11px] text-rose-950 space-y-0.5">
                                      <div>
                                        Giỗ tiếp theo: <strong className="text-rose-900 font-semibold">{info.nextSolarDateStr} ({info.nextDayOfWeek})</strong>
                                      </div>
                                      <div className="text-rose-800/80 italic text-[10.5px]">
                                        (còn {info.nextDaysLeft} ngày nữa)
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Birth Place */}
                  {selectedNode.birthPlace && (
                    <div className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-1">
                      <span className="block text-ink-charcoal/40 text-[9px] font-mono uppercase tracking-wider">Nơi sinh (Quê quán)</span>
                      <span className="font-semibold text-ink-charcoal flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#4a90e2]" />
                        <span className="truncate">{selectedNode.birthPlace}</span>
                      </span>
                    </div>
                  )}

                  {/* Death Place */}
                  {selectedNode.deathPlace && !selectedNode.isLiving && (
                    <div className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-1">
                      <span className="block text-ink-charcoal/40 text-[9px] font-mono uppercase tracking-wider">Nơi mất</span>
                      <span className="font-semibold text-ink-charcoal flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-[#e25c5c]" />
                        <span className="truncate">{selectedNode.deathPlace}</span>
                      </span>
                    </div>
                  )}

                  {/* Residence */}
                  <div className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-0.5 md:col-span-2">
                    <span className="block text-ink-charcoal/40 text-[9px] font-mono uppercase tracking-wider">Nơi cư trú hiện nay / xưa</span>
                    <span className="font-semibold text-ink-charcoal flex items-start space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-secondary mt-0.5 shrink-0" />
                      <span className="leading-tight">{selectedNode.residence || 'Thủy nguyên, Hải Phòng (Gốc tổ)'}</span>
                    </span>
                  </div>

                  {/* Burial place */}
                  <div className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-0.5 md:col-span-2">
                    <span className="block text-ink-charcoal/40 text-[9px] font-mono uppercase tracking-wider">Lăng mộ / Nơi an táng</span>
                    <span className="font-semibold text-ink-charcoal flex items-start space-x-1">
                      <Award className="w-3.5 h-3.5 text-[#7b5800] mt-0.5 shrink-0" />
                      <span className="leading-tight">{selectedNode.burialPlace || 'Khu mộ chi họ Cao gia bản xứ'}</span>
                    </span>
                  </div>

                  {/* Phone list (Only shows phone 1, phone 2 enters if present) */}
                  {(selectedNode.phone1 || selectedNode.phone2 || selectedNode.phone3) && (
                    <div className="bg-amber-100/30 p-3 rounded border border-amber-200/50 space-y-1 md:col-span-2">
                      <span className="block text-[#7b5800] text-[9.5px] font-mono uppercase tracking-wider font-bold">Số điện thoại liên lạc</span>
                      <div className="flex flex-col gap-1 text-xs">
                        {selectedNode.phone1 && (
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 bg-amber-200 text-[#7b5800] text-[8.5px] px-1 md:px-1.5 py-0.5 rounded font-mono font-bold leading-none">Liên lạc 1</span>
                            <a href={`tel:${selectedNode.phone1}`} className="text-primary hover:underline font-mono font-medium">{selectedNode.phone1}</a>
                          </div>
                        )}
                        {selectedNode.phone2 && (
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 bg-amber-200 text-[#7b5800] text-[8.5px] px-1 md:px-1.5 py-0.5 rounded font-mono font-bold leading-none">Liên lạc 2</span>
                            <a href={`tel:${selectedNode.phone2}`} className="text-primary hover:underline font-mono font-medium">{selectedNode.phone2}</a>
                          </div>
                        )}
                        {selectedNode.phone3 && (
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 bg-amber-200 text-[#7b5800] text-[8.5px] px-1 md:px-1.5 py-0.5 rounded font-mono font-bold leading-none">Liên lạc 3</span>
                            <a href={`tel:${selectedNode.phone3}`} className="text-primary hover:underline font-mono font-medium">{selectedNode.phone3}</a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Email contact (Only shows if present) */}
                  {selectedNode.email && (
                    <div className="bg-amber-100/30 p-3 rounded border border-amber-200/50 space-y-1 md:col-span-2">
                      <span className="block text-[#7b5800] text-[9.5px] font-mono uppercase tracking-wider font-bold">Địa chỉ Email liên lạc</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="shrink-0 bg-amber-200 text-[#7b5800] text-[8.5px] px-1.5 py-0.5 rounded font-mono font-bold leading-none uppercase">Email</span>
                        <a href={`mailto:${selectedNode.email}`} className="text-primary hover:underline font-mono font-medium break-all">{selectedNode.email}</a>
                      </div>
                    </div>
                  )}

                  {/* Mother reference detail (Displays who refers to this child for multiple wives tracking with automated father.spouseDetails child lookup) */}
                  {selectedNode.motherName && (
                    <div className="bg-rose-50/50 p-3 rounded border border-rose-100/50 space-y-1 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="block text-rose-950/75 text-[9px] font-mono uppercase tracking-wider font-bold">Mẫu hệ (Mẹ sinh thành)</span>
                        <span className="text-[8px] bg-rose-100/80 text-rose-800 px-1.5 py-0.5 rounded scale-90">Bản mẫu</span>
                      </div>
                      <span className="font-semibold text-rose-900 flex items-center space-x-1 py-0.5">
                        <Users className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>Bà: {selectedNode.motherName}</span>
                      </span>
                      
                      {motherDetail ? (
                        <div className="pt-2 border-t border-rose-200/50 space-y-1.5 text-[11px] font-sans text-ink-charcoal/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <div>
                              <span className="opacity-65">Tình trạng:</span> <strong className="text-rose-900">{motherDetail.isLiving ? "Còn sống" : "Đã mất (hoặc không rõ)"}</strong>
                            </div>
                            {motherDetail.solarBirthDate && (
                              <div className="sm:col-span-2">
                                <span className="opacity-65">Ngày sinh (Dương lịch):</span> <strong>{motherDetail.solarBirthDate}</strong>
                              </div>
                            )}
                            {!motherDetail.solarBirthDate && motherDetail.birthYear && (
                              <div>
                                <span className="opacity-65">Năm sinh:</span> <strong>{motherDetail.birthYear}</strong>
                              </div>
                            )}
                            {motherDetail.solarDeathDate && (
                              <div className="sm:col-span-2">
                                <span className="opacity-65">Ngày mất (Dương lịch):</span> <strong>{motherDetail.solarDeathDate}</strong>
                              </div>
                            )}
                            {!motherDetail.solarDeathDate && motherDetail.deathYear && (
                              <div>
                                <span className="opacity-65">Năm mất:</span> <strong>{motherDetail.deathYear}</strong>
                              </div>
                            )}
                            {motherDetail.birthPlace && (
                              <div className="sm:col-span-2"><span className="opacity-65">Quê sinh:</span> <strong>{motherDetail.birthPlace}</strong></div>
                            )}
                            {motherDetail.deathPlace && (
                              <div className="sm:col-span-2"><span className="opacity-65">Nơi mất:</span> <strong>{motherDetail.deathPlace}</strong></div>
                            )}
                            {motherDetail.burialPlace && motherDetail.burialPlace !== motherDetail.deathPlace && (
                              <div className="sm:col-span-2"><span className="opacity-65">Nơi an táng:</span> <strong>{motherDetail.burialPlace}</strong></div>
                            )}
                            {motherDetail.residence && (
                              <div className="sm:col-span-2"><span className="opacity-65">Nơi cư trú:</span> <strong>{motherDetail.residence}</strong></div>
                            )}
                            {motherDetail.lunarAnniversary && (
                              <div className="sm:col-span-2"><span className="opacity-65">Kỵ nhật (Ngày giỗ):</span> <strong>{motherDetail.lunarAnniversary}</strong></div>
                            )}
                            {(motherDetail.phone1 || motherDetail.phone2 || motherDetail.phone3) && (
                              <div className="sm:col-span-2 pt-1 uppercase text-[8px] tracking-wider leading-none text-rose-900/60 font-semibold font-mono">
                                📱 Điện thoại mẫu thân:
                                <div className="flex flex-col gap-0.5 mt-1 font-bold">
                                  {motherDetail.phone1 && <div>SĐT 1: <a href={`tel:${motherDetail.phone1}`} className="underline font-mono text-primary">{motherDetail.phone1}</a></div>}
                                  {motherDetail.phone2 && <div>SĐT 2: <a href={`tel:${motherDetail.phone2}`} className="underline font-mono text-primary">{motherDetail.phone2}</a></div>}
                                  {motherDetail.phone3 && <div>SĐT 3: <a href={`tel:${motherDetail.phone3}`} className="underline font-mono text-primary">{motherDetail.phone3}</a></div>}
                                </div>
                              </div>
                            )}
                            {motherDetail.email && (
                              <div className="sm:col-span-2 pt-1 uppercase text-[8px] tracking-wider leading-none text-rose-900/60 font-semibold font-mono">
                                ✉️ Email mẫu thân:
                                <div className="mt-1 font-bold">
                                  <a href={`mailto:${motherDetail.email}`} className="underline font-mono text-primary break-all">{motherDetail.email}</a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-rose-950/40 italic pt-1 border-t border-rose-200/50">
                          Chưa cập nhật chi tiết hành trạng mẫu thân.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsible interactive Spouses layout with detailed metadata lookups */}
                  <div className="bg-white/80 p-3 rounded border border-black/[0.03] space-y-1.5 md:col-span-2">
                    <span className="block text-ink-charcoal/40 text-[9px] font-mono uppercase tracking-wider">Phối ngẫu thất thất (Vợ / Chồng)</span>
                    <div className="font-semibold text-ink-charcoal space-y-1.5">
                      {parseSpouses(selectedNode.spouse).length > 0 ? (
                        parseSpouses(selectedNode.spouse).map((sp, idx) => {
                          const isFemale = selectedNode.gender === 'nữ';
                          const totalSpouses = parseSpouses(selectedNode.spouse).length;
                          const spouseRanks = isFemale ? (totalSpouses <= 1 ? ["Chồng"] : ["Chồng đầu", "Chồng thứ"]) : ["Chính thất (Vợ đầu & sinh cả)", "Thứ thất (Vợ thứ hai)", "Kế thất (Vợ thứ ba)"];
                          const rankLabel = isFemale ? (totalSpouses <= 1 ? "Chồng" : (idx === 0 ? "Chồng đầu" : "Chồng thứ")) : (idx < spouseRanks.length ? spouseRanks[idx] : `Khắp phụ (Phối ngẫu thứ ${idx + 1})`);
                          
                          // Look up spouse rich detail
                          const cleanSpouseName = sp.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
                          const sDetail = selectedNode.spouseDetails?.find(d => {
                            const dName = d.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
                            return dName === cleanSpouseName || dName.includes(cleanSpouseName) || cleanSpouseName.includes(dName);
                          });

                          const isExpanded = !!expandedSpouseNames[sp];
                          const toggleSpouse = () => {
                            setExpandedSpouseNames(prev => ({
                              ...prev,
                              [sp]: !prev[sp]
                            }));
                          };

                          return (
                            <div key={idx} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0 space-y-1.5">
                              <div onClick={toggleSpouse} className="flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-black/[0.02] p-1 rounded transition-colors select-none">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" />
                                  <span className="text-primary hover:underline">{sp}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8.5px] bg-[#eeeee9] text-[#7b5800] px-1.5 py-0.5 rounded font-mono font-medium scale-95 uppercase">
                                    {rankLabel}
                                  </span>
                                  <span className="text-[8px] text-gray-400 font-normal">
                                    {isExpanded ? '▲ Thu gọn' : '▼ Chi tiết'}
                                  </span>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="pl-5 pr-2 py-1.5 bg-rose-50/20 border-l-2 border-rose-300 rounded text-xs font-sans text-ink-charcoal space-y-1">
                                  {sDetail ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] leading-relaxed text-ink-charcoal/80">
                                      <div>
                                        <span className="text-ink-charcoal/45 font-medium">Tình trạng:</span> <strong className="text-rose-900">{sDetail.isLiving ? "Còn sống" : "Đã mất (hoặc không rõ)"}</strong>
                                      </div>
                                      {sDetail.solarBirthDate && (
                                        <div className="sm:col-span-2">
                                          <span className="text-ink-charcoal/45 font-medium">Ngày sinh (Dương lịch):</span> <strong>{sDetail.solarBirthDate}</strong>
                                        </div>
                                      )}
                                      {!sDetail.solarBirthDate && sDetail.birthYear && (
                                        <div>
                                          <span className="text-ink-charcoal/45 font-medium">Năm sinh:</span> <strong>{sDetail.birthYear}</strong>
                                        </div>
                                      )}
                                      {sDetail.solarDeathDate && (
                                        <div className="sm:col-span-2">
                                          <span className="text-ink-charcoal/45 font-medium">Ngày mất (Dương lịch):</span> <strong>{sDetail.solarDeathDate}</strong>
                                        </div>
                                      )}
                                      {!sDetail.solarDeathDate && sDetail.deathYear && (
                                        <div>
                                          <span className="text-ink-charcoal/45 font-medium">Năm mất:</span> <strong>{sDetail.deathYear}</strong>
                                        </div>
                                      )}
                                      {sDetail.birthPlace && (
                                        <div className="sm:col-span-2"><span className="text-ink-charcoal/45 font-medium">Quê quán (Nơi sinh):</span> <strong>{sDetail.birthPlace}</strong></div>
                                      )}
                                      {sDetail.deathPlace && (
                                        <div className="sm:col-span-2"><span className="text-ink-charcoal/45 font-medium">Nơi mất:</span> <strong>{sDetail.deathPlace}</strong></div>
                                      )}
                                      {sDetail.burialPlace && sDetail.burialPlace !== sDetail.deathPlace && (
                                        <div className="sm:col-span-2"><span className="text-ink-charcoal/45 font-medium">Nơi an táng:</span> <strong>{sDetail.burialPlace}</strong></div>
                                      )}
                                      {sDetail.residence && (
                                        <div className="sm:col-span-2"><span className="text-ink-charcoal/45 font-medium">Nơi ở hiện tại/xưa:</span> <strong>{sDetail.residence}</strong></div>
                                      )}
                                      {sDetail.lunarAnniversary && (
                                        <div className="sm:col-span-2"><span className="text-ink-charcoal/45 font-medium">Kỵ nhật (Ngày giỗ):</span> <strong>{sDetail.lunarAnniversary}</strong></div>
                                      )}
                                      {(sDetail.phone1 || sDetail.phone2 || sDetail.phone3) && (
                                        <div className="sm:col-span-2 pt-1 font-semibold uppercase text-[8px] tracking-wider leading-none text-rose-900/60 font-mono">
                                          📱 Số điện thoại liên lạc:
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {sDetail.phone1 && <a href={`tel:${sDetail.phone1}`} className="underline font-mono text-primary bg-white px-1.5 py-0.5 border border-rose-200 rounded shrink-0">{sDetail.phone1}</a>}
                                            {sDetail.phone2 && <a href={`tel:${sDetail.phone2}`} className="underline font-mono text-primary bg-white px-1.5 py-0.5 border border-rose-200 rounded shrink-0">{sDetail.phone2}</a>}
                                            {sDetail.phone3 && <a href={`tel:${sDetail.phone3}`} className="underline font-mono text-primary bg-white px-1.5 py-0.5 border border-rose-200 rounded shrink-0">{sDetail.phone3}</a>}
                                          </div>
                                        </div>
                                      )}
                                      {sDetail.email && (
                                        <div className="sm:col-span-2 pt-1 font-semibold uppercase text-[8px] tracking-wider leading-none text-rose-900/60 font-mono">
                                          ✉️ Địa chỉ Email:
                                          <div className="mt-1">
                                            <a href={`mailto:${sDetail.email}`} className="underline font-mono text-primary bg-white px-1.5 py-0.5 border border-rose-200 rounded shrink-0 font-medium inline-block break-all">{sDetail.email}</a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5 text-[11px] leading-relaxed text-ink-charcoal/80">
                                      <p className="italic text-gray-500 text-[10.5px]">Chưa lưu hành trạng chi tiết của vị phối ngẫu này.</p>
                                    </div>
                                  )}

                                  {/* Edit spouse action for PC Sidebar */}
                                  {isAdmin && (
                                    <div className="pt-2 border-t border-rose-200/50 mt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditSpouse(sp, sDetail);
                                        }}
                                        className="px-2.5 py-1 bg-amber-100/90 hover:bg-amber-200 text-amber-950 text-[10.5px] font-sans font-semibold rounded border border-amber-200 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                      >
                                        <FileText className="w-3 h-3 text-rose-750" />
                                        <span>Sửa hành trạng hành phả</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-ink-charcoal/40 italic text-[11px] block">Chưa ghi chép bàng thất</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Detailed chronicle text */}
              <div className="space-y-2">
                <span className="block text-[9.5px] font-mono text-ink-charcoal/40 uppercase tracking-widest">
                  Hành trạng tiên nhân chép tạc
                </span>
                <div className="bg-white p-4 rounded-sm border border-[#8c716e]/10 text-xs text-ink-charcoal/80 leading-relaxed text-justify shadow-inner max-h-[190px] overflow-y-auto scrollbar-thin">
                  {selectedNode.description || 'Hành trạng cổ dã của cụ hiền chưa thể hiện chi tiết, ban liên lạc đang mướn dịch gia thư chi chép tạc biên mục.'}
                </div>
              </div>

              {/* Form trigger to ADD children or spouses live */}
              <div className="pt-4 border-t border-[#8c716e]/20 space-y-4">
                
                {/* Admin Mode Gate Access Security Overlay */}
                {!isAdmin ? (
                  <div className="bg-amber-50/10 border border-dashed border-amber-500/35 rounded p-4 text-center space-y-2.5">
                    <Lock className="w-5 h-5 mx-auto text-amber-700 animate-pulse" />
                    <div>
                      <h5 className="font-serif text-xs font-bold text-[#8b1c1c]">Ghi Chép Phả Hệ (Admin Only)</h5>
                      <p className="text-[10px] text-ink-charcoal/60 leading-normal mt-0.5">
                        Tính năng bổ sung con cháu mới yêu cầu quyền quản trị ban liên lạc. Quý cụ liên kết nhanh bằng nút dưới.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAdmin(true)} // Soft bypass triggers standard admin tools straight away for easiest evaluation!
                      className="px-3 py-1.5 bg-[#8b1c1c] hover:bg-[#a02222] text-silk-paper text-[10px] font-sans font-semibold rounded shadow transition-all flex items-center gap-1 mx-auto"
                    >
                      <Unlock className="w-3 h-3 text-amber-300" />
                      <span>Kích hoạt quyền Admin nhanh 🔑</span>
                    </button>
                  </div>
                ) : (
                  // Active forms if admin logged-in
                  <>
                    {!isAddingNode ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            onClick={startAddChild}
                            className="px-3 py-2 bg-[#8b1c1c] hover:bg-[#a02222] text-silk-paper rounded-sm text-xs font-sans font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm con cháu</span>
                          </button>
                          <button
                            onClick={startAddSpouse}
                            className="px-3 py-2 bg-[#ffdea6] hover:bg-[#fdc34d] text-[#271900] rounded-sm text-xs font-sans font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <Heart className="w-3.5 h-3.5 text-rose-700" />
                            <span>Thêm vợ/chồng</span>
                          </button>
                          <button
                            onClick={startEditing}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-silk-paper rounded-sm text-xs font-sans font-bold flex items-center justify-center gap-1 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-300" />
                            <span>Sửa thông tin cụ</span>
                          </button>
                        </div>

                        {/* Dedicated Clans rule controller block inside the Admin panel */}
                        <div className="bg-emerald-50/80 border border-emerald-300 rounded p-3 mt-1.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-serif text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <Award className="w-4 h-4 text-emerald-700" />
                              <span>Chế độ Kế thừa Gia tộc</span>
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none shrink-0 ${
                              clanLeaderRuleActive 
                                ? 'bg-emerald-600 text-white animate-pulse' 
                                : 'bg-gray-250 text-gray-750 border border-gray-300'
                            }`}>
                              {clanLeaderRuleActive ? 'ĐANG BẬT 👑' : 'ĐANG TẮT ⚙️'}
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-900/80 leading-normal">
                            Tự động phân giải các chức danh <strong>Trưởng tộc</strong>, <strong>Trưởng nam</strong>, và <strong>Đích tôn</strong> chuẩn từng nhánh hậu duệ.
                          </p>
                          <button
                            type="button"
                            onClick={() => setClanLeaderRuleActive(prev => !prev)}
                            className={`w-full py-2 px-3 text-xs font-sans font-bold rounded shadow-sm transition-all border flex items-center justify-center gap-1.5 ${
                              clanLeaderRuleActive
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800'
                                : 'bg-white hover:bg-emerald-50 border-emerald-500 text-emerald-800'
                            }`}
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>{clanLeaderRuleActive ? 'Tắt chế độ kế thừa gia tộc ❌' : 'Bật chế độ kế thừa gia tộc 📜'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleFormSubmit} className="bg-white p-4 rounded-sm border border-[#8c716e]/15 space-y-3 shadow-inner">
                        <div className="flex justify-between items-center border-b border-ink-charcoal/5 pb-2">
                          <span className="font-serif text-xs font-bold text-primary flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#7b5800]" />
                            <span>
                              {addType === 'child' && `Ghi thế hậu duệ cho cụ ${selectedNode.name}`}
                              {addType === 'spouse' && `Thêm phối ngẫu cho cụ ${selectedNode.name}`}
                              {addType === 'edit_spouse' && `Sửa phối ngẫu (${editingSpouseOriginalName}) cho cụ ${selectedNode.name}`}
                              {addType === 'edit' && `Chỉnh sửa thông tin cụ ${selectedNode.name}`}
                            </span>
                          </span>
                          <button 
                            type="button" 
                            onClick={handleCancelAdd}
                            className="text-rose-700 hover:underline text-[9px] font-mono cursor-pointer"
                          >
                            [Hủy bỏ]
                          </button>
                        </div>

                        {addType === 'child' && (
                          <div className="space-y-2.5">
                            {/* Vital names */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-5 flex items-end pb-0.5">Họ & Tên hậu duệ *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Cao Văn Xuân"
                                  value={newMemberName}
                                  onChange={(e) => setNewMemberName(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block font-semibold text-[#7b5800] h-5 flex items-end pb-0.5">Giới tính</label>
                                <select
                                  value={newMemberGender}
                                  onChange={(e) => setNewMemberGender(e.target.value as 'nam' | 'nữ')}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                >
                                  <option value="nam">Nam (Con trai)</option>
                                  <option value="nữ">Nữ (Con gái)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2 p-2.5 bg-amber-50/20 border border-[#8c716e]/10 rounded-sm">
                              <label className="text-[10px] font-mono text-ink-charcoal/60 uppercase block font-semibold">Tước hàm/Danh xưng (Vừa chọn vừa điền)</label>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-sans text-ink-charcoal/50 block">1. Vai vế/Danh xưng chính</label>
                                  <select
                                    value={["", "Trưởng chi", "Trưởng tộc", "Đệ nhị", "Đệ tam", "Gái cả", "Gái thứ 1", "Gái thứ 2", "Gái thứ 3", "Đích tôn"].includes(newMemberRankRole) ? newMemberRankRole : (newMemberRankRole ? "custom" : "")}
                                    onChange={(e) => {
                                      if (e.target.value !== "custom") {
                                        setNewMemberRankRole(e.target.value);
                                      }
                                    }}
                                    className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                  >
                                    <option value="">-- Không chọn --</option>
                                    <option value="Trưởng tộc">Trưởng tộc</option>
                                    <option value="Trưởng chi">Trưởng chi</option>
                                    <option value="Đích tôn">Đích tôn</option>
                                    <option value="Đệ nhị">Đệ nhị</option>
                                    <option value="Đệ tam">Đệ tam</option>
                                    <option value="Gái cả">Gái cả</option>
                                    <option value="Gái thứ 1">Gái thứ 1</option>
                                    <option value="Gái thứ 2">Gái thứ 2</option>
                                    <option value="Gái thứ 3">Gái thứ 3</option>
                                    <option value="custom">Nhập tự do...</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-sans text-ink-charcoal/50 block">Nhập vai vế (nếu tự do)</label>
                                  <input
                                    type="text"
                                    placeholder="Hoặc tự nhập vai vế..."
                                    value={newMemberRankRole}
                                    onChange={(e) => setNewMemberRankRole(e.target.value)}
                                    className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-sans text-ink-charcoal/50 block">2. Tước vị / Học hàm / Danh hiệu khác (nếu có)</label>
                                <input
                                  type="text"
                                  placeholder="Tiến sĩ, Đại tá, Giáo sư, Anh hùng..."
                                  value={newMemberCustomSuffix}
                                  onChange={(e) => setNewMemberCustomSuffix(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>

                              <div className="text-[9px] text-[#7b5800] bg-white/50 border border-amber-100 rounded px-1.5 py-1 font-sans flex flex-col gap-0.5">
                                <span className="font-bold uppercase tracking-wider text-[8px] text-ink-charcoal/55">Danh xưng hiển thị tự động:</span>
                                <span className="font-semibold text-[10px] text-primary">
                                  {formatNodeTitle({
                                    generation: selectedNode ? selectedNode.generation + 1 : 1,
                                    isLiving: newMemberIsLiving,
                                    birthYear: newMemberBirthYear,
                                    deathYear: newMemberDeathYear,
                                    rankRole: newMemberRankRole,
                                    customSuffix: newMemberCustomSuffix
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Chronology years */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-6 flex items-end pb-0.5">Năm sinh</label>
                                <input
                                  type="text"
                                  placeholder="1885"
                                  value={newMemberBirthYear}
                                  onChange={(e) => setNewMemberBirthYear(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-6 flex items-end pb-0.5">Năm mất (bỏ trống nếu sống)</label>
                                <input
                                  type="text"
                                  disabled={newMemberIsLiving}
                                  placeholder={newMemberIsLiving ? 'Còn sống' : '1962'}
                                  value={newMemberIsLiving ? '' : newMemberDeathYear}
                                  onChange={(e) => setNewMemberDeathYear(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Solar Exact Dates with Automated Lunar Calculation helper */}
                            <div className="grid grid-cols-2 gap-2 bg-amber-50/20 p-2 rounded border border-amber-900/5">
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-amber-950 uppercase block">Ngày sinh Dương lịch</label>
                                <input
                                  type="text"
                                  placeholder="19/04/1990"
                                  value={newMemberSolarBirthDate}
                                  onChange={(e) => {
                                    setNewMemberSolarBirthDate(e.target.value);
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3 && parts[2].length === 4) {
                                      setNewMemberBirthYear(parts[2]);
                                    }
                                  }}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                                {newMemberSolarBirthDate && convertSolarToLunarText(newMemberSolarBirthDate) && (
                                  <p className="text-[9px] text-[#7b5800] leading-tight font-medium mt-0.5">
                                    Tức: {convertSolarToLunarText(newMemberSolarBirthDate)}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-amber-950 uppercase block">Ngày mất Dương lịch</label>
                                <input
                                  type="text"
                                  disabled={newMemberIsLiving}
                                  placeholder={newMemberIsLiving ? 'Còn sống' : '25/12/2021'}
                                  value={newMemberIsLiving ? '' : newMemberSolarDeathDate}
                                  onChange={(e) => {
                                    setNewMemberSolarDeathDate(e.target.value);
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3 && parts[2].length === 4) {
                                      setNewMemberDeathYear(parts[2]);
                                    }
                                  }}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                                {!newMemberIsLiving && newMemberSolarDeathDate && convertSolarToLunarText(newMemberSolarDeathDate) && (
                                  <p className="text-[9px] text-rose-900 leading-tight font-medium mt-0.5">
                                    Tức: {convertSolarToLunarText(newMemberSolarDeathDate)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Living relative check status */}
                            <div className="flex items-center space-x-2 pt-1">
                              <input 
                                type="checkbox"
                                id="isLivingMemberForm"
                                checked={newMemberIsLiving}
                                onChange={(e) => {
                                  setNewMemberIsLiving(e.target.checked);
                                  if (e.target.checked) setNewMemberDeathYear('');
                                }}
                                className="w-3.5 h-3.5 text-primary border-[#8c716e]/20 rounded focus:ring-amber-500"
                              />
                              <label htmlFor="isLivingMemberForm" className="text-[10px] font-sans font-bold text-[#7b5800] cursor-pointer">
                                🌟 Người này còn sống (Viền note-card sáng vàng)
                              </label>
                            </div>

                            {/* Spouses mother assignments dropdown */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Mẹ sinh thành (Vợ cụ nào)</label>
                              {parseSpouses(selectedNode.spouse).length > 0 ? (
                                <select
                                  value={newMemberMother}
                                  onChange={(e) => setNewMemberMother(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                >
                                  <option value="">-- Chưa rõ / Trưởng chi thất truyền --</option>
                                  {parseSpouses(selectedNode.spouse).map((sp, idx) => (
                                    <option key={idx} value={sp}>{sp} (Vợ thứ {idx+1})</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Ví dụ: Bà cả Nguyễn Thị Diễm"
                                  value={newMemberMother}
                                  onChange={(e) => setNewMemberMother(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              )}
                              <p className="text-[8px] text-ink-charcoal/40 leading-normal">
                                * Giúp phân biệt rạch ròi chi con cháu nào thuộc dòng vợ cả hay vợ hai.
                              </p>
                            </div>

                            {/* Phone 1, 2, 3 block */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block">Số điện thoại liên lạc (Nhập tối đa 3 số)</label>
                              <div className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="text"
                                  placeholder="SĐT số 1"
                                  value={newMemberPhone1}
                                  onChange={(e) => setNewMemberPhone1(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SĐT số 2"
                                  value={newMemberPhone2}
                                  onChange={(e) => setNewMemberPhone2(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SĐT số 3"
                                  value={newMemberPhone3}
                                  onChange={(e) => setNewMemberPhone3(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Email block */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block">Địa chỉ Email liên lạc</label>
                              <input
                                type="email"
                                placeholder="vi-du@email.com"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            {/* Birthplace and Deathplace */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi sinh (Quê quán)</label>
                                <input
                                  type="text"
                                  placeholder="Ninh Bình"
                                  value={newMemberBirthPlace}
                                  onChange={(e) => setNewMemberBirthPlace(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi mất</label>
                                <input
                                  type="text"
                                  disabled={newMemberIsLiving}
                                  placeholder={newMemberIsLiving ? 'Còn sống' : 'Hà Nội'}
                                  value={newMemberIsLiving ? '' : newMemberDeathPlace}
                                  onChange={(e) => setNewMemberDeathPlace(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Lunar death date & Residence */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Kỵ nhật (Âm lịch)</label>
                                <input
                                  type="text"
                                  placeholder="Giỗ ngày 15/08"
                                  value={newMemberLunarAnniversary}
                                  onChange={(e) => setNewMemberLunarAnniversary(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi cư trú</label>
                                <input
                                  type="text"
                                  placeholder="Phú Mỹ, Gia Viễn"
                                  value={newMemberResidence}
                                  onChange={(e) => setNewMemberResidence(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-[#7b5800] uppercase block">Nơi an táng lăng mộ</label>
                              <input
                                type="text"
                                placeholder="Cánh đồng chi họ Cao Nam..."
                                value={newMemberBurial}
                                onChange={(e) => setNewMemberBurial(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Bản thân phối ngẫu (Nếu có sẵn vợ)</label>
                              <input
                                type="text"
                                placeholder="Nguyễn Thị Bưởi"
                                value={newMemberSpouse}
                                onChange={(e) => setNewMemberSpouse(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Hành trạng biên niên tóm lược</label>
                              <textarea
                                rows={2}
                                placeholder="Gia phả biên niên chưa chi tiết hành sự cổ thảo..."
                                value={newMemberDescription}
                                onChange={(e) => setNewMemberDescription(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-primary resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {(addType === 'spouse' || addType === 'edit_spouse') && (
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block font-bold text-rose-800">
                                {addType === 'edit_spouse' ? "Họ & Tên vợ / chồng cần sửa *" : "Họ & Tên vợ / chồng bổ sung *"}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="Lê Thị Huệ (Thứ thất)"
                                value={newMemberSpouse}
                                onChange={(e) => setNewMemberSpouse(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1.5 px-2 text-xs focus:outline-none focus:border-primary font-semibold text-rose-900"
                              />
                            </div>

                            {/* Spouses chronology years */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-6 flex items-end pb-0.5">Năm sinh</label>
                                <input
                                  type="text"
                                  placeholder="1890"
                                  value={spouseBirthYear}
                                  onChange={(e) => setSpouseBirthYear(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-6 flex items-end pb-0.5">Năm mất (bỏ trống nếu sống)</label>
                                <input
                                  type="text"
                                  disabled={spouseIsLiving}
                                  placeholder={spouseIsLiving ? 'Còn sống' : '1970'}
                                  value={spouseIsLiving ? '' : spouseDeathYear}
                                  onChange={(e) => setSpouseDeathYear(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Solar Exact Dates for Spouse with Automated Lunar Calculation helper */}
                            <div className="grid grid-cols-2 gap-2 bg-rose-50/30 p-2 rounded border border-rose-950/10">
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-rose-950 uppercase block">Ngày sinh Dương lịch</label>
                                <input
                                  type="text"
                                  placeholder="19/04/1990"
                                  value={spouseSolarBirthDate}
                                  onChange={(e) => {
                                    setSpouseSolarBirthDate(e.target.value);
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3 && parts[2].length === 4) {
                                      setSpouseBirthYear(parts[2]);
                                    }
                                  }}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                                {spouseSolarBirthDate && convertSolarToLunarText(spouseSolarBirthDate) && (
                                  <p className="text-[9px] text-[#7b5800] leading-tight font-medium mt-0.5">
                                    Tức: {convertSolarToLunarText(spouseSolarBirthDate)}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-rose-950 uppercase block">Ngày mất Dương lịch</label>
                                <input
                                  type="text"
                                  disabled={spouseIsLiving}
                                  placeholder={spouseIsLiving ? 'Còn sống' : '25/12/2021'}
                                  value={spouseIsLiving ? '' : spouseSolarDeathDate}
                                  onChange={(e) => {
                                    setSpouseSolarDeathDate(e.target.value);
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3 && parts[2].length === 4) {
                                      setSpouseDeathYear(parts[2]);
                                    }
                                  }}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                                {!spouseIsLiving && spouseSolarDeathDate && convertSolarToLunarText(spouseSolarDeathDate) && (
                                  <p className="text-[9px] text-rose-900 leading-tight font-medium mt-0.5">
                                    Tức: {convertSolarToLunarText(spouseSolarDeathDate)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Spouses places */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Quê quán (Nơi sinh)</label>
                                <input
                                  type="text"
                                  placeholder="Phú Thọ"
                                  value={spouseBirthPlace}
                                  onChange={(e) => setSpouseBirthPlace(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi mất</label>
                                <input
                                  type="text"
                                  disabled={spouseIsLiving}
                                  placeholder={spouseIsLiving ? 'Còn sống' : 'Ninh Bình'}
                                  value={spouseIsLiving ? '' : spouseDeathPlace}
                                  onChange={(e) => setSpouseDeathPlace(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Spouses Residence and Anniversary */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi cư trú</label>
                                <input
                                  type="text"
                                  placeholder="Phú Mỹ, Ninh Bình"
                                  value={spouseResidence}
                                  onChange={(e) => setSpouseResidence(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Kỵ nhật (Âm lịch)</label>
                                <input
                                  type="text"
                                  placeholder="Giỗ mùng 10/10"
                                  value={spouseLunarAnniversary}
                                  onChange={(e) => setSpouseLunarAnniversary(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Spouses Phone 1, 2, 3 block */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block">Số điện thoại liên lạc (Nhập tối đa 3 số)</label>
                              <div className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="text"
                                  placeholder="SĐT số 1"
                                  value={spousePhone1}
                                  onChange={(e) => setSpousePhone1(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SĐT số 2"
                                  value={spousePhone2}
                                  onChange={(e) => setSpousePhone2(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SĐT số 3"
                                  value={spousePhone3}
                                  onChange={(e) => setSpousePhone3(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Spouse Email block */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block">Địa chỉ Email liên lạc</label>
                              <input
                                type="email"
                                placeholder="vi-du-phoi-ngau@email.com"
                                value={spouseEmail}
                                onChange={(e) => setSpouseEmail(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            {/* Spouses Living Relative checkbox */}
                            <div className="flex items-center space-x-2 pt-1">
                              <input 
                                type="checkbox"
                                id="isLivingSpouseForm"
                                checked={spouseIsLiving}
                                onChange={(e) => {
                                  setSpouseIsLiving(e.target.checked);
                                  if (e.target.checked) setSpouseDeathYear('');
                                }}
                                className="w-3.5 h-3.5 text-rose-600 border-[#8c716e]/20 rounded focus:ring-rose-500"
                              />
                              <label htmlFor="isLivingSpouseForm" className="text-[10px] font-sans font-bold text-rose-900 cursor-pointer">
                                💖 Người này còn sống
                              </label>
                            </div>

                            <p className="text-[9.5px] text-rose-900 bg-rose-50 p-2 rounded border border-rose-100/50 leading-normal">
                              * Vợ mới thêm sẽ tự động được gán là Chính thất, Thứ thất hoặc Kế thất theo thứ tự trong hồ sơ thờ phụng của cụ.
                            </p>
                          </div>
                        )}

                        {addType === 'edit' && (
                          <div className="space-y-2.5">
                            {/* Vital names */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-5 flex items-end pb-0.5">Họ & Tên *</label>
                                <input
                                  type="text"
                                  required
                                  value={newMemberName}
                                  onChange={(e) => setNewMemberName(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block font-semibold text-[#7b5800] h-5 flex items-end pb-0.5">Giới tính</label>
                                <select
                                  value={newMemberGender}
                                  onChange={(e) => setNewMemberGender(e.target.value as 'nam' | 'nữ')}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                >
                                  <option value="nam">Nam (Con trai)</option>
                                  <option value="nữ">Nữ (Con gái)</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2 p-2.5 bg-amber-50/20 border border-[#8c716e]/10 rounded-sm">
                              <label className="text-[10px] font-mono text-ink-charcoal/60 uppercase block font-semibold">Tước hàm/Danh xưng (Vừa chọn vừa điền)</label>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-sans text-ink-charcoal/50 block">1. Vai vế/Danh xưng chính</label>
                                  <select
                                    value={["", "Trưởng chi", "Trưởng tộc", "Đệ nhị", "Đệ tam", "Gái cả", "Gái thứ 1", "Gái thứ 2", "Gái thứ 3", "Đích tôn"].includes(newMemberRankRole) ? newMemberRankRole : (newMemberRankRole ? "custom" : "")}
                                    onChange={(e) => {
                                      if (e.target.value !== "custom") {
                                        setNewMemberRankRole(e.target.value);
                                      }
                                    }}
                                    className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                  >
                                    <option value="">-- Không chọn --</option>
                                    <option value="Trưởng tộc">Trưởng tộc</option>
                                    <option value="Trưởng chi">Trưởng chi</option>
                                    <option value="Đích tôn">Đích tôn</option>
                                    <option value="Đệ nhị">Đệ nhị</option>
                                    <option value="Đệ tam">Đệ tam</option>
                                    <option value="Gái cả">Gái cả</option>
                                    <option value="Gái thứ 1">Gái thứ 1</option>
                                    <option value="Gái thứ 2">Gái thứ 2</option>
                                    <option value="Gái thứ 3">Gái thứ 3</option>
                                    <option value="custom">Nhập tự do...</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-sans text-ink-charcoal/50 block">Nhập vai vế (nếu tự do)</label>
                                  <input
                                    type="text"
                                    placeholder="Hoặc tự nhập vai vế..."
                                    value={newMemberRankRole}
                                    onChange={(e) => setNewMemberRankRole(e.target.value)}
                                    className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] font-sans text-ink-charcoal/50 block">2. Tước vị / Học hàm / Danh hiệu khác (nếu có)</label>
                                <input
                                  type="text"
                                  placeholder="Tiến sĩ, Đại tá, Giáo sư, Anh hùng..."
                                  value={newMemberCustomSuffix}
                                  onChange={(e) => setNewMemberCustomSuffix(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>

                              <div className="text-[9px] text-[#7b5800] bg-white/50 border border-amber-100 rounded px-1.5 py-1 font-sans flex flex-col gap-0.5">
                                <span className="font-bold uppercase tracking-wider text-[8px] text-ink-charcoal/55">Danh xưng hiển thị tự động:</span>
                                <span className="font-semibold text-[10px] text-primary">
                                  {formatNodeTitle({
                                    generation: selectedNode ? selectedNode.generation : 1,
                                    isLiving: newMemberIsLiving,
                                    birthYear: newMemberBirthYear,
                                    deathYear: newMemberDeathYear,
                                    rankRole: newMemberRankRole,
                                    customSuffix: newMemberCustomSuffix
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Chronology years */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-6 flex items-end pb-0.5">Năm sinh</label>
                                <input
                                  type="text"
                                  value={newMemberBirthYear}
                                  onChange={(e) => setNewMemberBirthYear(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block h-6 flex items-end pb-0.5">Năm mất (bỏ trống nếu sống)</label>
                                <input
                                  type="text"
                                  disabled={newMemberIsLiving}
                                  placeholder={newMemberIsLiving ? 'Còn sống' : 'Năm mất'}
                                  value={newMemberIsLiving ? '' : newMemberDeathYear}
                                  onChange={(e) => setNewMemberDeathYear(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Solar Exact Dates with Automated Lunar Calculation helper */}
                            <div className="grid grid-cols-2 gap-2 bg-amber-50/20 p-2 rounded border border-amber-900/5">
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-amber-950 uppercase block">Ngày sinh Dương lịch</label>
                                <input
                                  type="text"
                                  placeholder="19/04/1990"
                                  value={newMemberSolarBirthDate}
                                  onChange={(e) => {
                                    setNewMemberSolarBirthDate(e.target.value);
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3 && parts[2].length === 4) {
                                      setNewMemberBirthYear(parts[2]);
                                    }
                                  }}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                                {newMemberSolarBirthDate && convertSolarToLunarText(newMemberSolarBirthDate) && (
                                  <p className="text-[9px] text-[#7b5800] leading-tight font-medium mt-0.5">
                                    Tức: {convertSolarToLunarText(newMemberSolarBirthDate)}
                                  </p>
                                )}
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-semibold text-amber-950 uppercase block">Ngày mất Dương lịch</label>
                                <input
                                  type="text"
                                  disabled={newMemberIsLiving}
                                  placeholder={newMemberIsLiving ? 'Còn sống' : '25/12/2021'}
                                  value={newMemberIsLiving ? '' : newMemberSolarDeathDate}
                                  onChange={(e) => {
                                    setNewMemberSolarDeathDate(e.target.value);
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3 && parts[2].length === 4) {
                                      setNewMemberDeathYear(parts[2]);
                                    }
                                  }}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                                {!newMemberIsLiving && newMemberSolarDeathDate && convertSolarToLunarText(newMemberSolarDeathDate) && (
                                  <p className="text-[9px] text-rose-900 leading-tight font-medium mt-0.5">
                                    Tức: {convertSolarToLunarText(newMemberSolarDeathDate)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Living relative check status */}
                            <div className="flex items-center space-x-2 pt-1">
                              <input 
                                type="checkbox"
                                id="isLivingEditForm"
                                checked={newMemberIsLiving}
                                onChange={(e) => {
                                  setNewMemberIsLiving(e.target.checked);
                                  if (e.target.checked) setNewMemberDeathYear('');
                                }}
                                className="w-3.5 h-3.5 text-primary border-[#8c716e]/20 rounded focus:ring-amber-500"
                              />
                              <label htmlFor="isLivingEditForm" className="text-[10px] font-sans font-bold text-[#7b5800] cursor-pointer">
                                🌟 Người này còn sống (Viền note-card sáng vàng)
                              </label>
                            </div>

                            {/* Phone 1, 2, 3 block */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block">Số điện thoại liên lạc (Nhập tối đa 3 số)</label>
                              <div className="grid grid-cols-3 gap-1.5">
                                <input
                                  type="text"
                                  placeholder="SĐT số 1"
                                  value={newMemberPhone1}
                                  onChange={(e) => setNewMemberPhone1(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SĐT số 2"
                                  value={newMemberPhone2}
                                  onChange={(e) => setNewMemberPhone2(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SĐT số 3"
                                  value={newMemberPhone3}
                                  onChange={(e) => setNewMemberPhone3(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-1.5 text-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Email block */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase block">Địa chỉ Email liên lạc</label>
                              <input
                                type="email"
                                placeholder="vi-du@email.com"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            {/* Birthplace and Deathplace */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi sinh (Quê quán)</label>
                                <input
                                  type="text"
                                  value={newMemberBirthPlace}
                                  onChange={(e) => setNewMemberBirthPlace(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi mất</label>
                                <input
                                  type="text"
                                  disabled={newMemberIsLiving}
                                  placeholder={newMemberIsLiving ? 'Còn sống' : 'Nơi mất'}
                                  value={newMemberIsLiving ? '' : newMemberDeathPlace}
                                  onChange={(e) => setNewMemberDeathPlace(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
                                />
                              </div>
                            </div>

                            {/* Lunar death date & Residence */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Kỵ nhật (Âm lịch)</label>
                                <input
                                  type="text"
                                  value={newMemberLunarAnniversary}
                                  onChange={(e) => setNewMemberLunarAnniversary(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Nơi cư trú</label>
                                <input
                                  type="text"
                                  value={newMemberResidence}
                                  onChange={(e) => setNewMemberResidence(e.target.value)}
                                  className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-[#7b5800] uppercase block">Nơi an táng lăng mộ</label>
                              <input
                                type="text"
                                value={newMemberBurial}
                                onChange={(e) => setNewMemberBurial(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Bản thân phối ngẫu (Ngăn cách dấu phẩy nếu nhiều vợ)</label>
                              <input
                                type="text"
                                placeholder="Nguyễn Thị Bưởi"
                                value={newMemberSpouse}
                                onChange={(e) => setNewMemberSpouse(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Hành trạng biên niên tóm lược</label>
                              <textarea
                                rows={2}
                                value={newMemberDescription}
                                onChange={(e) => setNewMemberDescription(e.target.value)}
                                className="w-full bg-white border border-[#8c716e]/20 rounded-sm py-1 px-2 text-xs focus:outline-none focus:border-primary resize-none"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2 bg-secondary hover:bg-[#684900] text-silk-paper font-sans font-semibold text-xs rounded transition-all shadow"
                        >
                          Cột Ghi Sáp Nhập Sổ Phả ✍️
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#fafaf5] border border-dashed border-[#8c716e]/30 p-12 text-center rounded text-ink-charcoal/40" id="tree-profile-empty">
              <Scroll className="w-12 h-12 text-[#7b5800]/30 mx-auto mb-4 animate-bounce" />
              <p className="font-serif text-sm">Vui lòng chạm cụ tổ từ sơ đồ để thâu vọng túc trực và tra cứu thông tư gia phả.</p>
            </div>
          )}
        </div>

      </section>

      {/* MOBILE POPUP DIALOG FOR COMPACT NOTE CARD CLICK EXPANSIONS */}
      {isMobileModalOpen && selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className="bg-[#fafaf5] border-2 border-[#7b5800] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 space-y-5">
            
            {/* Close button top right */}
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-[#eeeee9] rounded-full text-ink-charcoal/70 hover:text-rose-700 font-bold"
            >
              <X className="w-5 h-5 shadow-none" />
            </button>

            {/* Mobile Tag generation */}
            <div className="inline-block py-1 px-2.5 bg-primary text-silk-paper text-[9px] font-mono font-bold rounded uppercase tracking-widest leading-none">
              THẾ HỆ ĐỜI {selectedNode.generation}
            </div>

            {/* Hero names */}
            <div className="space-y-1.5 border-b border-[#8c716e]/20 pb-3">
              <span className="text-[9px] font-mono text-[#7b5800] tracking-widest uppercase block font-semibold mb-1">Xác thực gia phả</span>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-primary">{selectedNode.name}</h3>
              </div>
              {formatNodeTitle(selectedNode) && (
                <p className="text-xs font-sans font-bold text-[#7b5800] tracking-wide uppercase">
                  {formatNodeTitle(selectedNode)}
                </p>
              )}

              {/* Giỗ năm nay directly below title / text.xs on mobile */}
              {anniversaryInfo && (
                <div className="pt-2 text-xs font-sans text-ink-charcoal/85 space-y-1 block border-t border-[#8c716e]/10 mt-2" id="anniversary-bio-banner-mobile">
                  {anniversaryInfo.daysLeft > 0 ? (
                    <>
                      <div className="text-[11px] font-medium text-rose-950">
                        Giỗ năm nay: <span className="font-semibold text-rose-900">{anniversaryInfo.solarDateStr} ({anniversaryInfo.dayOfWeek})</span>
                      </div>
                      <div className="text-rose-800 text-[10.5px] font-medium italic">
                        (Còn {anniversaryInfo.daysLeft} ngày nữa)
                      </div>
                    </>
                  ) : anniversaryInfo.isToday ? (
                    <>
                      <div className="text-[11px] font-medium text-rose-950">
                        Giỗ năm nay: <span className="font-semibold text-rose-900">{anniversaryInfo.solarDateStr} ({anniversaryInfo.dayOfWeek})</span>
                      </div>
                      <div className="text-rose-700 font-bold animate-pulse text-[11px] uppercase tracking-wide">
                        (Hôm nay chính sự ngày giỗ!)
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] font-medium text-rose-950">
                        Giỗ năm nay: <span className="font-semibold text-ink-charcoal/70">{anniversaryInfo.solarDateStr} ({anniversaryInfo.dayOfWeek})</span>
                      </div>
                      <div className="text-ink-charcoal/50 italic text-[10.5px]">
                        (Đã qua {Math.abs(anniversaryInfo.daysLeft)} ngày)
                      </div>
                      <div className="text-[11px] pt-1 border-t border-black/[0.03] mt-1 space-y-0.5">
                        <div>
                          Giỗ tiếp theo: <span className="font-semibold text-rose-900">{anniversaryInfo.nextSolarDateStr} ({anniversaryInfo.nextDayOfWeek})</span>
                        </div>
                        <div className="text-rose-800/80 text-[10.5px] font-medium italic">
                          (còn {anniversaryInfo.nextDaysLeft} ngày)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Comprehensive details for Mobile */}
            <div className="space-y-3.5 text-xs font-sans animate-fade-in">
              
               {/* Sinh mất correctly mapped */}
              <div className="bg-white p-3 rounded border border-black/[0.03] flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#7b5800]" />
                <div>
                  <span className="block text-[8px] font-mono uppercase text-ink-charcoal/40 tracking-wider">Sinh thời & Tạ thế</span>
                  <span className="font-semibold text-primary">
                    {(selectedNode.isLiving || (!selectedNode.deathYear && selectedNode.birthYear && parseInt(selectedNode.birthYear) > 1920)) 
                      ? `${selectedNode.birthYear || '?'}` 
                      : `${selectedNode.birthYear || '?'} – ${selectedNode.deathYear || '?'}`}
                  </span>
                </div>
              </div>

              {/* Lunar Death Date address */}
              <div 
                onClick={() => setShowAnniversaryDetails(!showAnniversaryDetails)}
                className="bg-white p-3 rounded border border-black/[0.03] flex flex-col gap-1.5 cursor-pointer hover:bg-rose-50/30 transition-all select-none"
              >
                <div className="flex items-start gap-3">
                  <Scroll className="w-4 h-4 text-rose-700 mt-0.5" />
                  <div className="w-full text-left">
                    <span className="block text-[8px] font-mono uppercase text-rose-950/40 tracking-wider">Kỵ nhật (Âm lịch)</span>
                    <span className="font-semibold text-rose-950 block">{selectedNode.lunarAnniversary || 'Chưa khảo trích'}</span>
                  </div>
                </div>
                <div className="pl-7 flex items-center text-[8px] text-rose-800 font-mono font-bold leading-none">
                  <span>{showAnniversaryDetails ? "▲ Thu gọn" : "▼ Xem chi tiết ngày giỗ"}</span>
                </div>
              </div>

              {/* Show anniversary details on mobile directly under */}
              {showAnniversaryDetails && !selectedNode.isLiving && selectedNode.lunarAnniversary && (
                <div className="bg-rose-50/40 p-3 rounded border border-rose-100/50 text-[10.5px] text-rose-950 space-y-1.5 text-left shadow-xs animate-fade-in">
                  <div className="font-bold text-rose-800 uppercase tracking-widest text-[8px] font-mono border-b border-rose-950/5 pb-1 mb-1.5 flex items-center gap-1">
                    <Scroll className="w-3 h-3 text-rose-700 hover:shadow-none" />
                    Chi tiết Ngày giỗ năm nay
                  </div>
                  {(() => {
                    const info = getAnniversaryCountdown(selectedNode.lunarAnniversary);
                    if (!info) return <span className="text-rose-950/50">Chưa xác định kỵ nhật năm nay</span>;
                    return (
                      <div className="space-y-1 bg-white/40 p-2 rounded border border-rose-100/20 leading-relaxed font-sans">
                        <div className="font-medium text-rose-950 text-[11px]">
                          Giỗ năm nay: <strong className="text-rose-900">{info.solarDateStr} ({info.dayOfWeek})</strong>
                        </div>
                        <div className="text-[10.5px]">
                          {info.isToday ? (
                            <strong className="text-emerald-700 font-bold uppercase tracking-wide">★ Hôm nay chính kỵ</strong>
                          ) : info.daysLeft > 0 ? (
                            <span className="text-rose-800 italic">(Còn {info.daysLeft} ngày nữa)</span>
                          ) : (
                            <div className="space-y-1 text-rose-900">
                              <span className="italic block text-rose-800/80">(Đã qua {Math.abs(info.daysLeft)} ngày)</span>
                              {info.nextSolarDateStr && (
                                <div className="pt-1 mt-1 border-t border-rose-950/5 text-[10.5px]">
                                  Bản giỗ tiếp theo: <strong>{info.nextSolarDateStr} ({info.nextDayOfWeek})</strong> <span className="italic text-rose-850">(còn {info.nextDaysLeft} ngày)</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Optional Birth & Death Places */}
              {selectedNode.birthPlace && (
                <div className="bg-white p-3 rounded border border-black/[0.03] flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#4a90e2]" />
                  <div>
                    <span className="block text-[8px] font-mono uppercase text-ink-charcoal/40 tracking-wider">Nơi sinh / Nguyên quán</span>
                    <span className="font-semibold text-ink-charcoal">{selectedNode.birthPlace}</span>
                  </div>
                </div>
              )}

              {selectedNode.deathPlace && !selectedNode.isLiving && (
                <div className="bg-white p-3 rounded border border-black/[0.03] flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#e25c5c]" />
                  <div>
                    <span className="block text-[8px] font-mono uppercase text-[#e25c5c] tracking-wider">Nơi mất</span>
                    <span className="font-semibold text-ink-charcoal">{selectedNode.deathPlace}</span>
                  </div>
                </div>
              )}

              {/* Residence */}
              <div className="bg-white p-3 rounded border border-black/[0.03] flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#7b5800] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[8px] font-mono uppercase text-ink-charcoal/40 tracking-wider">Bản quán / Nơi cư trú</span>
                  <span className="font-semibold text-ink-charcoal inline-block">{selectedNode.residence || 'Thủy nguyên, Hải Phòng'}</span>
                </div>
              </div>

              {/* Burial place */}
              <div className="bg-white p-3 rounded border border-black/[0.03] flex items-start gap-3">
                <Award className="w-4 h-4 text-[#7b5800] mt-0.5 shrink-0" />
                <div>
                  <span className="block text-[8px] font-mono uppercase text-ink-charcoal/40 tracking-wider">Nơi an táng lăng mộ</span>
                  <span className="font-semibold text-ink-charcoal inline-block">{selectedNode.burialPlace || 'Cao gia lăng viên'}</span>
                </div>
              </div>

              {/* Phone lists for Mobile */}
              {(selectedNode.phone1 || selectedNode.phone2 || selectedNode.phone3) && (
                <div className="bg-amber-100/30 p-3 rounded border border-amber-200/50 space-y-1.5Col space-y-1">
                  <span className="block text-[#7b5800] text-[8px] font-mono uppercase tracking-wider font-bold">Điện thoại liên hệ</span>
                  <div className="flex flex-col gap-1">
                    {selectedNode.phone1 && (
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-[#7b5800] text-[8px] px-1 py-0.5 rounded font-mono">SĐT 1</span>
                        <a href={`tel:${selectedNode.phone1}`} className="text-primary hover:underline font-mono font-medium">{selectedNode.phone1}</a>
                      </div>
                    )}
                    {selectedNode.phone2 && (
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-[#7b5800] text-[8px] px-1 py-0.5 rounded font-mono">SĐT 2</span>
                        <a href={`tel:${selectedNode.phone2}`} className="text-primary hover:underline font-mono font-medium">{selectedNode.phone2}</a>
                      </div>
                    )}
                    {selectedNode.phone3 && (
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-200 text-[#7b5800] text-[8px] px-1 py-0.5 rounded font-mono">SĐT 3</span>
                        <a href={`tel:${selectedNode.phone3}`} className="text-primary hover:underline font-mono font-medium">{selectedNode.phone3}</a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Multi wife Mother details */}
              {selectedNode.motherName && (
                <div className="bg-rose-50/50 p-3 rounded border border-rose-100/50 space-y-1.5 flex flex-col text-rose-950">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-rose-700 shrink-0" />
                    <div>
                      <span className="block text-[8px] font-mono uppercase text-rose-950/40 tracking-wider">Thống hệ mẫu thân</span>
                      <span className="font-bold">Bà: {selectedNode.motherName}</span>
                    </div>
                  </div>
                  {motherDetail && (
                    <div className="pt-1.5 border-t border-rose-200/50 text-[10.5px] grid grid-cols-1 gap-1">
                      <div>• Tình trạng: <strong>{motherDetail.isLiving ? "Còn sống" : "Đã mất (hoặc không rõ)"}</strong></div>
                      {motherDetail.solarBirthDate && <div>• Ngày sinh: <strong>{motherDetail.solarBirthDate}</strong></div>}
                      {!motherDetail.solarBirthDate && motherDetail.birthYear && <div>• Năm sinh: <strong>{motherDetail.birthYear}</strong></div>}
                      {motherDetail.solarDeathDate && <div>• Ngày mất: <strong>{motherDetail.solarDeathDate}</strong></div>}
                      {!motherDetail.solarDeathDate && motherDetail.deathYear && <div>• Năm mất: <strong>{motherDetail.deathYear}</strong></div>}
                      {motherDetail.birthPlace && <div>• Quê quán: <strong>{motherDetail.birthPlace}</strong></div>}
                      {motherDetail.deathPlace && <div>• Nơi mất: <strong>{motherDetail.deathPlace}</strong></div>}
                      {motherDetail.burialPlace && motherDetail.burialPlace !== motherDetail.deathPlace && <div>• Nơi an táng: <strong>{motherDetail.burialPlace}</strong></div>}
                      {motherDetail.residence && <div>• Nơi ở: <strong>{motherDetail.residence}</strong></div>}
                      {motherDetail.lunarAnniversary && <div>• Ngày giỗ: <strong>{motherDetail.lunarAnniversary}</strong></div>}
                    </div>
                  )}
                </div>
              )}

              {/* Spouses listed and numbered */}
              <div className="bg-white p-3 rounded border border-black/[0.03] space-y-2">
                <span className="block text-[8px] font-mono uppercase text-ink-charcoal/40 tracking-wider">
                  {selectedNode.gender === 'nữ' ? "Phối ngẫu liệt vị (Thông tin chồng)" : "Phối ngẫu liệt vị (Thông tin vợ)"}
                </span>
                {parseSpouses(selectedNode.spouse).length > 0 ? (
                  <div className="space-y-1.5 font-sans">
                    {parseSpouses(selectedNode.spouse).map((sp, idx) => {
                      const isFem = selectedNode.gender === 'nữ';
                      const spRanks = ["Vợ cả (Chính thất)", "Vợ thứ hai (Thứ thất)", "Vợ thứ ba (Kế thất)"];
                      const totalSp = parseSpouses(selectedNode.spouse).length;
                      const spLabel = isFem ? (totalSp <= 1 ? "Chồng" : (idx === 0 ? "Chồng đầu" : "Chồng thứ")) : (idx < spRanks.length ? spRanks[idx] : `Vợ thứ ${idx + 1}`);
                      
                      const cleanSpouseName = sp.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
                      const sDetail = selectedNode.spouseDetails?.find(d => {
                        const dName = d.name.toLowerCase().replace(/\s*\(.*\)\s*/g, '').trim();
                        return dName === cleanSpouseName || dName.includes(cleanSpouseName) || cleanSpouseName.includes(dName);
                      });

                      const isExpanded = !!expandedSpouseNames[sp];
                      const toggleSpouse = () => {
                        setExpandedSpouseNames(prev => ({ ...prev, [sp]: !prev[sp] }));
                      };

                      return (
                        <div key={idx} className="border-b border-gray-100 pb-1.5 last:border-0 last:pb-0 space-y-1">
                          <div onClick={toggleSpouse} className="flex items-center justify-between text-xs bg-[#fafaf5] px-2 py-1 rounded cursor-pointer">
                            <span className="flex items-center gap-1 font-medium text-rose-900">
                              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                              <span className="underline">{sp}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[8px] font-mono font-bold text-[#7b5800] uppercase">
                                {spLabel}
                              </span>
                              <span className="text-[8px] text-gray-400">
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-2 bg-rose-50/30 border-l border-rose-300 rounded text-[10.5px] leading-normal text-ink-charcoal space-y-1">
                              {sDetail ? (
                                <>
                                  <div>• Tình trạng: <strong>{sDetail.isLiving ? "Còn sống" : "Đã mất (hoặc không rõ)"}</strong></div>
                                  {sDetail.solarBirthDate && <div>• Ngày sinh: <strong>{sDetail.solarBirthDate}</strong></div>}
                                  {!sDetail.solarBirthDate && sDetail.birthYear && <div>• Năm sinh: <strong>{sDetail.birthYear}</strong></div>}
                                  {sDetail.solarDeathDate && <div>• Ngày mất: <strong>{sDetail.solarDeathDate}</strong></div>}
                                  {!sDetail.solarDeathDate && sDetail.deathYear && <div>• Năm mất: <strong>{sDetail.deathYear}</strong></div>}
                                  {sDetail.birthPlace && <div>• Quê quán: <strong>{sDetail.birthPlace}</strong></div>}
                                  {sDetail.deathPlace && <div>• Nơi mất: <strong>{sDetail.deathPlace}</strong></div>}
                                  {sDetail.burialPlace && sDetail.burialPlace !== sDetail.deathPlace && <div>• Nơi an táng: <strong>{sDetail.burialPlace}</strong></div>}
                                  {sDetail.residence && <div>• Nơi cư trú: <strong>{sDetail.residence}</strong></div>}
                                  {sDetail.lunarAnniversary && <div>• Ngày giỗ: <strong>{sDetail.lunarAnniversary}</strong></div>}
                                  {(sDetail.phone1 || sDetail.phone2 || sDetail.phone3) && (
                                    <div className="pt-1 font-mono text-[9px]">
                                      📞 SĐT liên hệ: {sDetail.phone1 || sDetail.phone2 || sDetail.phone3}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-gray-400 italic">Chưa ghi chép hành trạng chi tiết phối ngẫu.</div>
                              )}

                              {/* Edit spouse button on Mobile */}
                              {isAdmin && (
                                <div className="pt-1.5 border-t border-rose-200/50 mt-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Close mobile modal sheet to let form show on screen
                                      setIsMobileModalOpen(false);
                                      startEditSpouse(sp, sDetail);
                                    }}
                                    className="px-2 py-0.5 bg-amber-100 font-semibold text-amber-950 text-[9px] rounded border border-amber-200 cursor-pointer animate-pulse"
                                  >
                                    Cập nhật phối ngẫu (Sửa chắp bút)
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-ink-charcoal/40 italic block text-[10px]">Chưa ghi chép phối tỷ dã</span>
                )}
              </div>

            </div>

            {/* Hand-scrollable description biography */}
            <div className="space-y-1 bg-[#eeeee9]/40 p-3 rounded border border-ink-charcoal/5">
              <span className="block text-[8px] font-mono text-ink-charcoal/40 uppercase">Tiểu sử vắn tắt dã sử</span>
              <p className="text-[11px] text-ink-charcoal/80 leading-relaxed text-justify max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                {selectedNode.description || 'Hành trạng tiên nhân chưa thể hiện chi tiết, ban tôn tộc đang dốc sức dịch phả chép tạc biên niên.'}
              </p>
            </div>

            {/* Mobile close trigger buttons */}
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="w-full py-2 bg-primary hover:bg-[#8b1c1c] text-[#fafaf5] rounded font-serif text-xs font-semibold uppercase shadow-md transition-all text-center cursor-pointer"
            >
              Kính bái đóng thông tin
            </button>

          </div>
        </div>
      )}

      {/* ADMIN PASSWORD LOGIN DIALOG MODAL OVERLAY */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 transition-opacity animate-fade-in" id="admin-login-overlay">
          <div className="bg-[#fafaf5] border-2 border-amber-600 rounded-lg max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setShowAdminLoginModal(false)}
              className="absolute top-4 right-4 text-ink-charcoal/50 hover:text-black hover:font-bold"
            >
              <X className="w-4 h-4 border-none" />
            </button>

            <div className="flex items-center gap-1.5 text-amber-900 font-serif font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-700 animate-pulse" />
              <span>XÁC DIỆN QUẢN TRỊ VIÊN GIA PHẢ</span>
            </div>

            <p className="text-[11px] text-ink-charcoal/60 leading-relaxed">
              Vui lòng nhập mật mã định danh quản trị chi họ để mở khoá tính năng sửa đổi, sáp nhập con cháu mới. Mật mã mặc định là <strong>"admin"</strong>.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-ink-charcoal/50 uppercase">Mật mã Quản trị *</label>
                <input
                  type="password"
                  required
                  placeholder="Nhập 'admin'..."
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-white border border-[#8c716e]/30 rounded p-2 text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              {adminLoginError && (
                <p className="text-[9px] text-red-700 bg-red-50 p-1.5 rounded border border-red-200 lider-tight">
                  {adminLoginError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdmin(true);
                    setShowAdminLoginModal(false);
                    setAdminPasswordInput('');
                    setAdminLoginError('');
                  }}
                  className="py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-sans font-bold text-xs rounded transition-all text-center cursor-pointer"
                >
                  Xác Thực Nhanh ⚡
                </button>
                <button
                  type="submit"
                  className="py-2 bg-amber-600 hover:bg-amber-700 text-silk-paper font-sans font-bold text-xs rounded transition-all text-center cursor-pointer"
                >
                  Kiểm tra mật mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
