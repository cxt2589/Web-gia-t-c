/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AncestorNode, LineageNews, AnniversaryEvent, ClanContribution } from '../types';

export const COMPONENT_IMAGES = {
  inkLandscape: '/src/assets/images/vietnamese_ink_landscape_1779856029849.png',
  templeRoof: '/src/assets/images/ancient_temple_roof_1779856049722.png',
};

// Ancestral family tree - starting from Generation 1 to Generation 5 with expandable sub-members
export const ANCESTRAL_TREE: AncestorNode = {
  id: 'gen1-1',
  name: 'Cao Đại Lang (Thủy tổ cụ)',
  generation: 1,
  title: 'Thủy tổ khai cơ họ Cao Phú Mỹ',
  birthYear: '1615',
  deathYear: '1689',
  description: 'Thủy tổ triều Lê Trung Hưng, từ Thanh Hóa thiên cư mở đất, khai hoang lập ấp tại Phú Mỹ, Gia Viễn, Ninh Bình.',
  spouse: 'Trần Thị Hiền (Thủy tổ tỷ)',
  spouseList: ['Trần Thị Hiền (Thủy tổ tỷ)'],
  residence: 'Làng Phú Mỹ, huyện Gia Viễn, tỉnh Ninh Bình',
  burialPlace: 'Sơn lăng táng tại túc sơn phía Tây làng Phú Mỹ, thế hổ phục hướng Nam',
  lunarAnniversary: 'Ngày 10 tháng 03 (Âm lịch)',
  isLiving: false,
  children: [
    {
      id: 'gen2-1',
      name: 'Cao Khắc Tiệp',
      generation: 2,
      parentId: 'gen1-1',
      title: 'Đệ nhị thế tổ - Trưởng chi',
      birthYear: '1642',
      deathYear: '1712',
      spouse: 'Nguyễn Thị Ngọc (Chính thất), Lê Thị Hồng (Thứ thất)',
      spouseList: ['Nguyễn Thị Ngọc (Chính thất)', 'Lê Thị Hồng (Thứ thất)'],
      spouseDetails: [
        {
          name: 'Nguyễn Thị Ngọc (Chính thất)',
          birthYear: '1645',
          deathYear: '1720',
          residence: 'Yên Mô, Ninh Bình',
          birthPlace: 'Gia Viễn, Ninh Bình',
          deathPlace: 'Phú Mỹ, Ninh Bình',
          lunarAnniversary: 'Ngày 18 tháng 11 (Âm lịch)'
        },
        {
          name: 'Lê Thị Hồng (Thứ thất)',
          birthYear: '1648',
          deathYear: '1723',
          residence: 'Gia Thủy, Nho Quan, Ninh Bình',
          birthPlace: 'Nho Quan, Ninh Bình',
          deathPlace: 'Phú Mỹ, Ninh Bình',
          lunarAnniversary: 'Ngày 02 tháng 05 (Âm lịch)',
          phone1: '0912345678'
        }
      ],
      residence: 'Xã Gia Viễn, phủ Trường Yên, Ninh Bình',
      burialPlace: 'Gò Cành Đào, Giáp Sơn, Ninh Bình',
      lunarAnniversary: 'Ngày 15 tháng 08 (Âm lịch)',
      isLiving: false,
      description: 'Lập trường dạy thi thư, đào tạo nhiều tú tài sĩ tử trong vùng Ninh Bình, triều đình sắc phong dực bảo trung hưng.',
      children: [
        {
          id: 'gen3-1',
          name: 'Cao Văn Thành',
          generation: 3,
          parentId: 'gen2-1',
          title: 'Đệ tam thế tổ - Trưởng phân',
          birthYear: '1675',
          deathYear: '1745',
          spouse: 'Phạm Thị Mơ (Chính thất)',
          spouseList: ['Phạm Thị Mơ (Chính thất)'],
          motherName: 'Nguyễn Thị Ngọc (Chính thất)',
          residence: 'Xóm Ngoài, Phú Mỹ, Ninh Bình',
          burialPlace: 'Khu mộ cổ Cánh Đồng Trên, xã Gia Viễn',
          lunarAnniversary: 'Ngày 05 tháng Chạp (Âm lịch)',
          isLiving: false,
          description: 'Lãnh đạo phục dựng đê điều sông Hoàng Long, giữ gìn làng xã qua nạn bão lụt lịch sử.',
          children: [
            {
              id: 'gen4-1',
              name: 'Cao Viết Tiến',
              generation: 4,
              parentId: 'gen3-1',
              title: 'Đệ tứ thế tổ',
              birthYear: '1708',
              deathYear: '1778',
              spouse: 'Lương Thị Nhàn (Chính thất)',
              spouseList: ['Lương Thị Nhàn (Chính thất)'],
              motherName: 'Phạm Thị Mơ (Chính thất)',
              residence: 'Phú Mỹ, Ninh Bình',
              burialPlace: 'Đồi Thông Phía Tây, Gia Viễn',
              lunarAnniversary: 'Ngày 12 tháng 04 (Âm lịch)',
              isLiving: false,
              children: [
                {
                  id: 'gen5-1',
                  name: 'Cao Văn Minh',
                  generation: 5,
                  parentId: 'gen4-1',
                  title: 'Đệ ngũ thế tổ - Khoa bảng triều Lê',
                  birthYear: '1741',
                  deathYear: '1809',
                  spouse: 'Vũ Thị Thảo (Chính thất)',
                  spouseList: ['Vũ Thị Thảo (Chính thất)'],
                  motherName: 'Lương Thị Nhàn (Chính thất)',
                  residence: 'Hà Nội (Học sĩ), Phú Mỹ, Ninh Bình',
                  burialPlace: 'Nghĩa trang cổ họ Cao, túc sơn Ninh Bình',
                  lunarAnniversary: 'Ngày 22 tháng 10 (Âm lịch)',
                  isLiving: false,
                  description: 'Đỗ tú tài khoa thi Giáp Ngọ, giữ chức danh nho sư tại Quốc Tử Giám, lưu gia phong chép luật đức.',
                  children: [
                    {
                      id: 'gen6-1',
                      name: 'Cao Quốc Bảo',
                      generation: 6,
                      parentId: 'gen5-1',
                      title: 'Hậu duệ Đời 6 Trưởng Chi',
                      birthYear: '1948',
                      deathYear: '',
                      spouse: 'Lê Thanh Bình',
                      spouseList: ['Lê Thanh Bình'],
                      spouseDetails: [
                        {
                          name: 'Lê Thanh Bình',
                          birthYear: '1952',
                          isLiving: true,
                          residence: 'Xã Phú Mỹ, huyện Gia Viễn, tỉnh Ninh Bình',
                          birthPlace: 'Gia Lập, Gia Viễn, Ninh Bình',
                          phone1: '0904321987',
                          phone2: '0922334455'
                        }
                      ],
                      motherName: 'Vũ Thị Thảo (Chính thất)',
                      residence: 'Xã Phú Mỹ, huyện Gia Viễn, tỉnh Ninh Bình',
                      lunarAnniversary: '',
                      isLiving: true,
                      phone1: '0983124567',
                      phone2: '0912789456',
                      description: 'Đại lão niên hào kiệt, hiện đang là Trưởng ban khánh tiết tộc trưởng dòng họ Cao Phú Mỹ, hỗ trợ đôn đốc tu bổ tộc ước.'
                    },
                    {
                      id: 'gen6-2',
                      name: 'Cao Thị Minh Nguyệt',
                      generation: 6,
                      parentId: 'gen5-1',
                      title: 'Hậu duệ Đời 6 Đệ nhị',
                      birthYear: '1955',
                      deathYear: '',
                      spouse: 'Nguyễn Văn Hải',
                      spouseList: ['Nguyễn Văn Hải'],
                      motherName: 'Vũ Thị Thảo (Chính thất)',
                      residence: 'Quận 3, TP. Hồ Chí Minh',
                      lunarAnniversary: '',
                      isLiving: true,
                      description: 'Định cư phương Nam, tích cực đóng góp quỹ khuyến học thúc đẩy đạo nghĩa ngàn đời học vấn của tôn tri.'
                    }
                  ]
                }
              ]
            },
            {
              id: 'gen4-2',
              name: 'Cao Viết Huân',
              generation: 4,
              parentId: 'gen3-1',
              title: 'Đệ tứ thế tổ - Thứ chi',
              birthYear: '1712',
              deathYear: '1785',
              spouse: 'Bùi Thị Hòa (Chính thất)',
              spouseList: ['Bùi Thị Hòa (Chính thất)'],
              motherName: 'Phạm Thị Mơ (Chính thất)',
              residence: 'Yên Mô, Ninh Bình',
              burialPlace: 'Đồi Sỏi Đỏ, huyện Yên Mô',
              lunarAnniversary: 'Ngày 18 tháng 06 (Âm lịch)',
              isLiving: false,
              children: []
            }
          ]
        },
        {
          id: 'gen3-2',
          name: 'Cao Văn Đạt',
          generation: 3,
          parentId: 'gen2-1',
          title: 'Đệ tam thế tổ - Thứ phân',
          birthYear: '1680',
          deathYear: '1752',
          spouse: 'Lê Thị Thu (Chính thất)',
          spouseList: ['Lê Thị Thu (Chính thất)'],
          motherName: 'Lê Thị Hồng (Thứ thất)', // Born of Second Wife!
          residence: 'Ninh Bình',
          burialPlace: 'Bãi Cồn Trầm, Gia Viễn',
          lunarAnniversary: 'Ngày 09 tháng 11 (Âm lịch)',
          isLiving: false,
          children: []
        }
      ]
    },
    {
      id: 'gen2-2',
      name: 'Cao Khắc Chuẩn',
      generation: 2,
      parentId: 'gen1-1',
      title: 'Đệ nhị thế tổ - Thứ chi nhị',
      birthYear: '1648',
      deathYear: '1719',
      spouse: 'Hoàng Thị Trúc (Chính thất)',
      spouseList: ['Hoàng Thị Trúc (Chính thất)'],
      residence: 'Gia Viễn, Ninh Bình',
      burialPlace: 'Bãi Trong, Phú Mỹ',
      lunarAnniversary: 'Ngày 24 tháng Giêng (Âm lịch)',
      isLiving: false,
      children: []
    }
  ]
};

// Phả ký (Detailed narratives)
export const PHA_KY_SECTIONS = [
  {
    id: 'nguon-goc',
    title: 'Nguồn gốc & Khởi tổ',
    sub: 'Thuở thiên cư lập ấp',
    dropCap: 'N',
    text: 'nguồn gốc của dòng họ Cao tại Phú Mỹ bắt nguồn từ những thế kỷ trước, khi ngài Thủy tổ bắt đầu khai hoang lập ấp trên vùng đất Ninh Bình địa linh nhân kiệt. Theo ghi chép trong bộ phả cổ nhất còn lưu giữ được, dòng họ Cao vốn có nguồn gốc từ vùng Thanh Hóa, sau đó theo các cuộc di dân vào thế kỷ 17 mà chọn Phú Mỹ làm nơi an cư lạc nghiệp. Ngài khai khẩn bãi hoang bồi đắp lưu truyền nhiều thế hệ.',
    extraText: 'Ngài Thủy tổ là người có đức độ, tinh thông địa lý và nông tang. Ngài đã quy tụ người dân, khai phá rừng rậm, biến những bãi sình lầy thành ruộng lúa phì nhiêu. Dòng họ Cao từ đó mà nảy mầm, đâm chồi, trở thành một trong những chi họ lớn và có uy tín nhất trong vùng.'
  },
  {
    id: 'di-cu',
    title: 'Hành trình di cư',
    sub: 'Gian nan vượt dặm trường',
    dropCap: 'C',
    text: 'uộc di cư từ miền Trung ra phía Bắc không chỉ là hành trình tìm đất mới mà còn là hành trình gìn giữ bản sắc. Mỗi bước đi là một lời thề nguyện giữ đạo làm người, giữ lòng hiếu thuận. Dưới ách dâu bể của lịch sử, các tổ tiên họ Cao đã dẫn dắt gia quyến băng qua núi cao, đèo dốc hiểm trở để tìm kiếm dải đất an bình ven bờ sông Hoàng Long tươi đẹp.',
    extraText: 'Từng chiếc rương gỗ đựng gia phả, từng bát hương thờ tiên tổ được ôm chặt trong tấm áo nhuộm nâu bùn sương gió. Sự vững vàng trong ý chí của các bậc tiền nhân là nền tảng để con cháu ngày nay thấu hiểu giá trị của hòa bình, tình thân và cội nguồn sâu thẳm.'
  },
  {
    id: 'cong-trang',
    title: 'Công trạng tiền nhân',
    sub: 'Tấm lòng sắt son với non sông',
    dropCap: 'T',
    text: 'rải qua các triều đại Lê, Nguyễn cho đến thời kỳ cách mạng hiện đại, dòng họ Cao Phú Mỹ tự hào đóng góp nhiều người con ưu tú cho quê hương và đất nước. Nhiều liệt tổ liệt tông đỗ đạt khoa bảng, làm quan thanh liêm tại phủ giáo học, hoặc tham gia gìn giữ bờ cõi, bảo vệ quê hương thoát khỏi giặc ngoại xâm phương Bắc vững vàng.',
    extraText: 'Chiêm bái bia đá, sắc phong cổ còn truyền đời lưu giữ, thế hệ trẻ họ Cao tự răn mình phải nỗ lực học tập, rèn đức luyện tài để tiếp nối bảng vàng của tổ tông, làm sáng danh dòng tộc Cao Gia lẫy lừng giữa núi sông Ninh Bình hùng vĩ.'
  }
];

// Tộc ước Cao Gia
export const TOC_UOC_ITEMS = [
  {
    id: '01',
    title: 'Đạo hiếu và Tổ tiên',
    desc: 'Con cháu họ Cao phải lấy đạo hiếu làm đầu. Việc thờ cúng tổ tiên, chăm sóc phần mộ là trách nhiệm của mọi thành viên. Ngày giỗ Tổ (10/3 Âm lịch) toàn thể con cháu phải về tề tựu đông đủ để gắn kết tình thân gia tộc khăng khít.'
  },
  {
    id: '02',
    title: 'Học vấn và Tài năng',
    desc: 'Khuyến khích con cháu thi đua học tập, mang lại vinh quang cho dòng họ. Quỹ khuyến học Cao Gia sẽ khen thưởng những cá nhân có thành tích xuất sắc trong học tập và nghiên cứu khoa học, bồi dưỡng thế hệ kế cận tài đức vẹn toàn.'
  },
  {
    id: '03',
    title: 'Tương thân tương ái',
    desc: 'Trong dòng họ phải có sự đùm bọc, giúp đỡ lẫn nhau khi gặp khó khăn, hoạn nạn. Tối kỵ việc tranh chấp, gây mất đoàn kết nội bộ. Mọi mâu thuẫn phải được Hội đồng Tộc biểu hòa giải trên tinh thần thảo kính bao dung.'
  },
  {
    id: '04',
    title: 'Gìn giữ gia phong',
    desc: 'Gia đình là nền tảng. Con cháu phải sống trung thực, tuân thủ pháp luật nước nhà, lễ phép kính trên nhường dưới. Tránh xa các tệ nạn xã hội làm hoen ố thanh danh dòng họ.'
  }
];

// Lịch giỗ chi họ
export const ANNIVERSARY_EVENTS: AnniversaryEvent[] = [
  {
    id: 'ann1',
    title: 'Đại Lễ Giỗ Tổ Thủy Tổ cụ Cao Đại Lang',
    lunarDate: 'Ngày 10 tháng 03 (Âm lịch)',
    solarDate: '26/04/2026',
    host: 'Ban Liên Lạc Dòng Họ Cao Phú Mỹ',
    location: 'Từ đường Tổ họ Cao, Phú Mỹ, Gia Viễn, Ninh Bình',
    description: 'Ngày đại kỵ giỗ Thủy Tổ họ Cao Ninh Bình, dịp con cháu muôn phương quay về tụ họp hội bái.',
    ritualGuide: [
      '8:00 - Tế lễ cáo yết Tổ tiên và thắp hương đảnh lễ bái gia tự',
      '9:30 - Thụ ủy cáo báo gia tài và phát thưởng khuyến học gia tộc',
      '11:00 - Thụ lộc đại đoàn viên, tọa đàm liên hoan dòng tộc'
    ]
  },
  {
    id: 'ann2',
    title: 'Lễ Giỗ Đệ Nhị Thế Tổ Cao Khắc Tiệp',
    lunarDate: 'Ngày 15 tháng 08 (Âm lịch)',
    solarDate: '25/09/2026',
    host: 'Truởng chi Cao Văn Minh',
    location: 'Nhánh chi 1 Từ đường phụ, Gia Viễn, Ninh Bình',
    description: 'Tưởng niệm người khởi xướng phong trào học tập thi thư và dựng trường xưa của dòng họ.',
    ritualGuide: [
      '15:00 - Sửa soạn dâng hương bái vọng',
      '16:30 - Quây quần chuyện trò dặn dò gia quy cội nguồn'
    ]
  },
  {
    id: 'ann3',
    title: 'Lễ Chúc Thọ Đầu Xuân Thượng Thọ Cao Niên',
    lunarDate: 'Ngày 04 tháng Chạp / Giêng đầu xuân',
    solarDate: '20/02/2026',
    host: 'Hội đồng Lão thành họ Cao',
    location: 'Khuôn viên nhà văn hóa dòng họ Cao Phú Mỹ',
    description: 'Nghi thức dâng trà chúc thọ Đại Lão trên 70, 80 và 90 tuổi, duy trì sự kính lão đắc thọ.',
    ritualGuide: [
      '9:00 - Tặng bằng mừng thọ của Ban liên lạc họ Cao Việt Nam',
      '10:00 - Con cháu dâng trà và chụp ảnh kỷ niệm gia tộc sum vầy'
    ]
  }
];

// Tin tức dòng họ
export const LINEAGE_NEWS_DATA: LineageNews[] = [
  {
    id: 'news1',
    title: 'Khánh thành trùng tu tôn tạo Từ đường Tổ chi họ Cao tại Phú Mỹ',
    category: 'su_kien',
    summary: 'Sau hơn 6 tháng thi công với sự đóng góp tích cực của bà con nội ngoại, khuôn viên nhà thờ họ Cao đã hoàn tất trùng tu trang nghiêm.',
    content: 'Từ đường Đại Tông họ Cao Phú Mỹ, Ninh Bình đã được tu thiết, lợp lại ngói mới, dựng long đình đá trạm trổ tinh xảo và mở rộng tả hữu vu sân gạch cổ bái đường. Tổng chi phí công trình lên tới 680 triệu VND được quy góp minh bạch từ con cháu xa gần khắp tỉnh thành.',
    imageUrl: COMPONENT_IMAGES.templeRoof,
    date: '12/05/2025',
    author: 'Cao Văn Hùng - Trưởng Ban Xây dựng'
  },
  {
    id: 'news2',
    title: 'Vinh danh 12 Tân sinh viên đỗ thủ khoa, á khoa Đại học năm học vừa qua',
    category: 'hoat_dong',
    summary: 'Quỹ khuyến học Cao Gia tổ chức trao học bổng "Tiền nhân dẫn lối" trị giá 120 triệu VND cho con cháu đỗ đạt thủ khoa.',
    content: 'Ban giáo dục dòng họ đã tổng kết và trao những suất quà đầy ý nghĩa tới các em học sinh có thành tích bồi dưỡng xuất sắc cấp quốc gia và các cháu tân sinh viên đạt từ 27 điểm trở lên trong kỳ thi đại học vừa qua. Đây là sự kế tục nếp nhà thi thư của cụ Tổ xưa.',
    imageUrl: COMPONENT_IMAGES.inkLandscape,
    date: '20/08/2025',
    author: 'Hội Khuyến Học Cao Gia'
  },
  {
    id: 'news3',
    title: 'Kêu gọi công đức biên soạn toàn tập bách khoa "Phả ký Cao Tông Phú Mỹ"',
    category: 'dong_gop',
    summary: 'Nhằm hoàn thiện dữ liệu số hóa gia phả, ban phả tộc phát động quyên góp ghi chép lịch sử chi phái và hành trình di cư thời Minh triều Lê cổ.',
    content: 'Công tác dịch thuật các bản chữ Hán - Nôm sang chữ Quốc ngữ đang tiến hành khẩn trương bởi sự hỗ trợ của các Chuyên viên Viện Hán Nôm Việt Nam. Ban liên lạc rất mong các gia đình cung cấp thêm bản gia phả nhánh và tích cực đóng góp kinh phí in ấn.',
    imageUrl: COMPONENT_IMAGES.inkLandscape,
    date: '02/10/2025',
    author: 'Trưởng tộc Cao Văn Minh'
  }
];

// Danh sách con cháu đóng góp (Simulated live ledger)
export const CLAN_CONTRIBUTIONS: ClanContribution[] = [
  { id: 'c1', name: 'Cao Quốc Bảo', generation: 15, branch: 'Trưởng chi Phú Mỹ', amount: '15.000.000 VND', purpose: 'Đóng góp Quỹ trùng tu Từ Đường chi họ', date: '25/05/2026' },
  { id: 'c2', name: 'Cao Thị Minh Nguyệt', generation: 14, branch: 'Chi nhánh Sài Gòn', amount: '8.000.000 VND', purpose: 'Đóng góp Quỹ khuyến học bồi dưỡng nhân tài', date: '21/05/2026' },
  { id: 'c3', name: 'Cao Quang Dũng', generation: 16, branch: 'Thứ phái Gia Viễn', amount: '5.000.000 VND', purpose: 'Đúc bia đá Đại Thế Tổ', date: '15/05/2026' },
  { id: 'c4', name: 'Cao Hoài Nam', generation: 15, branch: 'Chi nhánh Hà Nội', amount: '10.000.000 VND', purpose: 'Quỹ hoạt động tế lễ Giỗ Tổ 2026', date: '10/05/2026' }
];
