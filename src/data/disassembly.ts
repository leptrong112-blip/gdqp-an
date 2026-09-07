import { AKPartDisassembly } from "../types";

export const AK_DISASSEMBLY_STEPS: AKPartDisassembly[] = [
  {
    id: "step1",
    name: "magazine-safety",
    vietnameseName: "Tháo hộp tiếp đạn & Khám súng",
    description: "Tay trái cầm ốp lót tay, tay phải bóp khóa giữ phát hộp tiếp đạn đẩy ra. Sau đó gạt khóa an toàn xuống, kéo bệ khóa nòng hết cỡ ra sau để khám buồng đạn xem có đạn sót hay không, thả bệ khóa nòng về và bóp cò sập búa.",
    correctStep: 1
  },
  {
    id: "step2",
    name: "accessory-kit",
    vietnameseName: "Tháo ống phụ tùng (hộp phụ tùng)",
    description: "Dùng ngón tay ấn vào nắp chứa phụ tùng ở báng súng để nắp mở ra, lôi ống phụ tùng ra ngoài và đóng nắp lò xo lại kín.",
    correctStep: 2
  },
  {
    id: "step3",
    name: "cleaning-rod",
    vietnameseName: "Tháo thông nòng (thao tác rút bệ khép)",
    description: "Kéo thông nòng lệch khỏi khe giữ đầu súng rồi rút thẳng thông nòng theo chiều dọc đặt gọn bên cạnh thảm ráp.",
    correctStep: 3
  },
  {
    id: "step4",
    name: "receiver-cover",
    vietnameseName: "Tháo nắp hộp khóa nòng",
    description: "Ấn ngón tay cái vào nút giữ bộ phận đẩy về nằm ở đuôi hộp khóa nòng, đồng thời tay kia nhấc nắp hộp khóa nòng lên trên và giật ra phía sau.",
    correctStep: 4
  },
  {
    id: "step5",
    name: "recoil-spring",
    vietnameseName: "Tháo bộ phận đẩy về (Lò xo đẩy về)",
    description: "Tay phải đẩy chuôi bộ phận đẩy về về phía trước cho ra khỏi rãnh chứa, nhấc nhẹ chuôi lên rồi rút toàn bộ lò xo đẩy về ra ngoài.",
    correctStep: 5
  },
  {
    id: "step6",
    name: "bolt-carrier",
    vietnameseName: "Tháo bệ khóa nòng & khóa nòng",
    description: "Tay phải kéo bệ khóa nòng hết cỡ ra sau, nhấc bệ khóa nòng lên trên nhấc khỏi rãnh trượt trong hộp khóa nòng, đưa ra ngoài.",
    correctStep: 6
  },
  {
    id: "step7",
    name: "bolt-separation",
    vietnameseName: "Tháo khóa nòng ra khỏi bệ",
    description: "Xoay khóa nòng sang trái, đẩy lùi ra sau cho chốt định vị lọt khớp rãnh, nhẹ nhàng tách rời khóa nòng ra khỏi bệ khóa nòng.",
    correctStep: 7
  },
  {
    id: "step8",
    name: "gas-tube",
    vietnameseName: "Tháo ống dẫn gas & ốp lót tay trên",
    description: "Tay phải nâng chốt lẫy chặn ống dẫn gas lên trên một góc 45 độ, tay trái nhấc ống dẫn gas và ốp lót tay trên ra khỏi miệng ôm bệ nòng.",
    correctStep: 8
  }
];
