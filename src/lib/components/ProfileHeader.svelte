<script lang="ts">
	export let profile: any;
	export let stats: any;
	export let isEditing: boolean = false;
	export let onUploadAvatar: () => void;
	export let onUploadBanner: () => void;
</script>

<div class="profile-header">
	<!-- Banner Section -->
	<div class="banner-section">
		{#if profile.banner}
			<img src={profile.banner} alt="Profile banner" class="banner-image" />
		{:else}
			<div class="banner-placeholder">
				<div class="banner-gradient"></div>
			</div>
		{/if}
		
		{#if isEditing}
			<button class="banner-upload-btn" on:click={onUploadBanner}>
				<i class="fas fa-camera"></i>
				<span>Change Banner</span>
			</button>
		{/if}
	</div>

	<!-- Profile Info Section -->
	<div class="profile-info">
		<div class="avatar-section">
			<div class="avatar-container">
				{#if profile.avatar}
					<img src={profile.avatar} alt="Profile avatar" class="avatar-image" />
				{:else}
					<div class="avatar-placeholder">
						<span class="avatar-initial">{profile.displayName.charAt(0)}</span>
					</div>
				{/if}
				
				{#if isEditing}
					<button class="avatar-upload-btn" on:click={onUploadAvatar}>
						<i class="fas fa-camera"></i>
					</button>
				{/if}
			</div>
		</div>

		<div class="profile-details">
			<div class="profile-name-section">
				<h1 class="profile-name">{profile.displayName}</h1>
				<div class="profile-meta">
					<span class="real-name">{profile.realName}</span>
					<span class="location">📍 {profile.location}</span>
					<span class="join-date">📅 Joined {profile.joinDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
				</div>
			</div>
			
			<div class="profile-bio">
				{profile.bio}
			</div>

			<div class="profile-stats">
				<div class="stat-item">
					<div class="stat-value">{stats.streamsHosted}</div>
					<div class="stat-label">Streams</div>
				</div>
				<div class="stat-item">
					<div class="stat-value">{stats.tournamentsWon}</div>
					<div class="stat-label">Wins</div>
				</div>
				<div class="stat-item">
					<div class="stat-value">{stats.followers.toLocaleString()}</div>
					<div class="stat-label">Followers</div>
				</div>
				<div class="stat-item">
					<div class="stat-value">{stats.communityRank}</div>
					<div class="stat-label">Rank</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.profile-header {
		margin-bottom: 3rem;
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	/* Banner Section */
	.banner-section {
		position: relative;
		height: 200px;
		overflow: hidden;
	}

	.banner-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.banner-placeholder {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.banner-gradient {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #4C63D2 0%, #7C3AED 35%, #2DD4BF 70%);
	}

	.banner-upload-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.8rem 1.2rem;
		background: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		backdrop-filter: blur(10px);
		transition: all 0.3s ease;
	}

	.banner-upload-btn:hover {
		background: rgba(0, 0, 0, 0.8);
		transform: translateY(-1px);
	}

	/* Profile Info */
	.profile-info {
		display: flex;
		align-items: flex-end;
		gap: 2rem;
		padding: 0 2rem 2rem 2rem;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-top: none;
		color: white;
		position: relative;
	}

	/* Avatar Section */
	.avatar-section {
		flex-shrink: 0;
		margin-top: -60px;
	}

	.avatar-container {
		position: relative;
		width: 120px;
		height: 120px;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid white;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		background: linear-gradient(135deg, #7C3AED, #2DD4BF);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 4px solid white;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.avatar-initial {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
	}

	.avatar-upload-btn {
		position: absolute;
		bottom: 5px;
		right: 5px;
		width: 32px;
		height: 32px;
		background: linear-gradient(135deg, #2DD4BF, #10B981);
		color: white;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.3s ease;
	}

	.avatar-upload-btn:hover {
		transform: scale(1.1);
		box-shadow: 0 4px 15px rgba(45, 212, 191, 0.4);
	}

	/* Profile Details */
	.profile-details {
		flex: 1;
		min-width: 0;
	}

	.profile-name-section {
		margin-bottom: 1rem;
	}

	.profile-name {
		font-family: 'Nunito', sans-serif;
		font-size: 2.2rem;
		font-weight: 800;
		margin: 0 0 0.5rem 0;
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
	}

	.profile-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
	}

	.profile-bio {
		margin-bottom: 1.5rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.9);
		max-width: 600px;
	}

	.profile-stats {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.stat-item {
		text-align: center;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2DD4BF;
		font-family: 'Nunito', sans-serif;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.8);
		margin-top: 0.2rem;
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.banner-section {
			height: 150px;
		}

		.profile-info {
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding: 1rem;
		}

		.avatar-section {
			margin-top: -40px;
		}

		.avatar-container {
			width: 100px;
			height: 100px;
		}

		.avatar-initial {
			font-size: 2rem;
		}

		.profile-name {
			font-size: 1.8rem;
		}

		.profile-meta {
			justify-content: center;
			flex-direction: column;
			align-items: center;
			gap: 0.5rem;
		}

		.profile-stats {
			justify-content: center;
		}

		.stat-value {
			font-size: 1.2rem;
		}

		.banner-upload-btn {
			top: 0.5rem;
			right: 0.5rem;
			padding: 0.6rem 1rem;
			font-size: 0.8rem;
		}
	}
</style>