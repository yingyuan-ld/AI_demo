
# GPT 训练阶段
- **流程**：Pretrain → SFT → Reward Model → PPO
- **含义**：先预训练基座，再监督微调学会按指令作答，然后训练奖励模型给回答打分，最后用 PPO 按奖励做强化学习对齐。

# Pretrain（预训练）
- **含义**：用海量无标注/弱标注文本做下一词预测等自监督任务，从零（或近乎从零）学语言统计规律，得到**基座模型**；后续 SFT、对齐都建立在它之上。

# SFT（Supervised Fine-Tuning，监督微调）
- **含义**：用「指令—高质量回答」成对数据继续训练，让基座模型学会按人类指令的**格式与风格**作答；改的是模型权重，数据规模远小于预训练。

# Reward Model（奖励模型）（教练员）
- **含义**：用人类（或更强模型）对多个回答的**偏好排序**训练出一个打分器，用来估计「哪个输出更好」；后续 PPO、拒绝采样等拿它当奖励/筛选信号。

# PPO（Proximal Policy Optimization，近端策略优化）
- **含义**：一种强化学习算法：生成回答 → 用 Reward Model 打分 → **小步**更新策略，并限制每次更新幅度以免训练崩掉；GPT 路线里接在 SFT 之后做对齐。


# Llama 训练阶段
- **流程**：Pretrain → Reward Model → Rejection Sampling → SFT → DPO
- **含义**：预训练后先得到奖励模型，用拒绝采样筛出高分样本再做 SFT，最后用 DPO 直接做偏好对齐（不必再走 PPO）。

# Rejection Sampling（拒绝采样）
- **含义**：同一提示生成多个候选，用 Reward Model 等打分，**只留下高分样本**（拒绝低分），再用这些精选样本做 SFT；Llama 路线用它把偏好信号变成高质量监督数据。

# DPO（Direct Preference Optimization，直接偏好优化）
- **含义**：不必单独再跑 Reward Model + PPO 那套强化学习循环，直接在「更好 / 更差」成对偏好数据上优化策略，使模型更倾向被偏好的回答；Llama 路线里常接在 SFT 之后。
